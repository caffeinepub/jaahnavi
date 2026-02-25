import Map "mo:core/Map";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  public type MarketSymbolData = {
    symbol : Text;
    lastPrice : Float;
    changePercent : Float;
    volume : Nat;
    oi : Nat; // Open Interest
  };

  public type IndicesSnapshot = {
    name : Text;
    lastPrice : Float;
    changePercent : Float;
    volume : Nat;
    oi : Nat; // Open Interest
  };

  public type UserProfile = {
    name : Text;
    username : Text;
  };

  type CEPEData = {
    symbol : Text;
    strike : Text;
    price : Float;
    oi : Float;
    doi : Float;
    trend : Text; // "bull" or "bear"
  };

  type OptionChainEntry = {
    symbol : Text;
    atm : Float;
    ce_atm_data : CEPEData;
    pe_atm_data : CEPEData;
    price : PriceDetails;
    scenarios : ScenarioTags;
  };

  type PriceDetails = {
    high : Float;
    open : Float;
    close : Float;
    low : Float;
    vwap : Float;
  };

  type ScenarioTags = {
    trending : Bool;
    pcr_tested : Bool;
    high_oi : Bool;
    reversal : Bool;
  };

  type CandlestickPattern = {
    patternType : Text;
    price : Float;
    wick_high : Float;
    wick_low : Float;
  };

  // Internal storage
  let optionChainData = Map.empty<Text, OptionChainEntry>();
  let openHighScanner = Map.empty<Text, PriceDetails>();
  let openLowScanner = Map.empty<Text, PriceDetails>();
  let candlestickPatterns = Map.empty<Text, CandlestickPattern>();
  let watchlist = Map.empty<Principal, Map.Map<Text, Float>>();
  let marketData = Map.empty<Text, PriceDetails>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let marketSymbols = Map.empty<Text, MarketSymbolData>();
  let indicesSnapshot = Map.empty<Text, IndicesSnapshot>();

  // Just need transform function to live at the actor scope
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Market Data Persistence
  // Admin-only: directly writing market symbol data modifies shared global state
  public shared ({ caller }) func updateMarketSymbolData(symbol : Text, data : MarketSymbolData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can directly update market data");
    };
    marketSymbols.add(symbol, data);
  };

  // User-only: reading market symbol data requires at least a registered user
  public query ({ caller }) func getMarketSymbolData(symbol : Text) : async ?MarketSymbolData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access market data");
    };
    marketSymbols.get(symbol);
  };

  // User-only: reading all market symbols requires at least a registered user
  public query ({ caller }) func getAllMarketSymbols() : async [MarketSymbolData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access market data");
    };
    marketSymbols.values().toArray();
  };

  // User-only: reading market snapshot requires at least a registered user
  public query ({ caller }) func getMarketSnapshot() : async [MarketSymbolData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access market data");
    };
    marketSymbols.values().toArray();
  };

  // User-only: reading indices snapshot requires at least a registered user
  public query ({ caller }) func getIndicesSnapshot() : async [IndicesSnapshot] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access indices data");
    };
    indicesSnapshot.values().toArray();
  };

  // Admin-only: triggers expensive HTTP outcalls and mutates shared global market state.
  // Allowing any user to trigger this would expose the canister to DoS via repeated
  // outcall cycles and uncontrolled mutation of shared data.
  public shared ({ caller }) func refreshMarketData() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can refresh market data");
    };

    let equitiesUrl = "https://www.nseindia.com/api/equity-stockIndices?index=SECURITIES%20IN%20F%26O";
    let indicesUrl = "https://www.nseindia.com/api/allIndices";

    func headersArray() : [OutCall.Header] {
      [
        { name = "Referer"; value = "https://www.nseindia.com" },
        { name = "User-Agent"; value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        { name = "Accept"; value = "application/json" },
      ];
    };

    let headers = headersArray();

    // Fetch equities
    let equitiesResult = await OutCall.httpGetRequest(equitiesUrl, headers, transform);
    switch (equitiesResult) {
      case (equitiesData) {
        // Store raw JSON as a text blob for frontend parsing
        marketSymbols.add("raw_equities_data", {
          symbol = "RAW_JSON";
          lastPrice = 0.0;
          changePercent = 0.0;
          volume = 0;
          oi = 0;
        });
      };
    };

    // Fetch indices
    let indicesResult = await OutCall.httpGetRequest(indicesUrl, headers, transform);
    switch (indicesResult) {
      case (indicesData) {
        // Store raw JSON as a text blob for frontend parsing
        indicesSnapshot.add("raw_indices_data", {
          name = "RAW_JSON";
          lastPrice = 0.0;
          changePercent = 0.0;
          volume = 0;
          oi = 0;
        });
      };
    };
    "Market data refreshed and stored";
  };

  // Admin-only: triggers an HTTP outcall to NSE and returns parsed option chain data.
  // This is an update call (not query) because it performs an HTTP outcall.
  // Restricted to admins to prevent DoS via repeated expensive outcalls from arbitrary users.
  public shared ({ caller }) func getOptionChain(symbol : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can fetch live option chain data");
    };

    let isIndex = symbol == "NIFTY" or symbol == "BANKNIFTY" or symbol == "FINNIFTY";
    let url = if (isIndex) {
      "https://www.nseindia.com/api/option-chain-indices?symbol=" # symbol;
    } else {
      "https://www.nseindia.com/api/option-chain-equities?symbol=" # symbol;
    };

    let headers : [OutCall.Header] = [
      { name = "Referer"; value = "https://www.nseindia.com" },
      { name = "User-Agent"; value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      { name = "Accept"; value = "application/json" },
    ];

    let result = await OutCall.httpGetRequest(url, headers, transform);
    result;
  };

  // User Profile Management
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Authentication and registration methods
  public shared ({ caller }) func registerUser(adminToken : Text, userProvidedToken : Text) : async () {
    AccessControl.initialize(accessControlState, caller, adminToken, userProvidedToken);
  };

  // Option chain data - read-only, restricted to authenticated users
  public query ({ caller }) func getOptionChainData(symbol : Text) : async OptionChainEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access option chain data");
    };
    switch (optionChainData.get(symbol)) {
      case (null) { Runtime.trap("Invalid symbol") };
      case (?data) { data };
    };
  };

  // Bullish scanner
  public query ({ caller }) func bullishScanner(symbol : Text) : async PriceDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access scanner data");
    };
    switch (openHighScanner.get(symbol)) {
      case (null) { Runtime.trap("Invalid symbol") };
      case (?data) { data };
    };
  };

  // Bearish scanner
  public query ({ caller }) func bearishScanner(symbol : Text) : async PriceDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access scanner data");
    };
    switch (openLowScanner.get(symbol)) {
      case (null) { Runtime.trap("Invalid symbol") };
      case (?data) { data };
    };
  };

  // Candlestick patterns
  public query ({ caller }) func getCandlestickPattern(patternType : Text) : async [CandlestickPattern] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access candlestick patterns");
    };
    candlestickPatterns.values().toArray().filter(func(pattern) { pattern.patternType == patternType });
  };

  // Watchlist management - per-user data, restricted to authenticated users
  public shared ({ caller }) func addToWatchlist(stockList : [(Text, Float)]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage watchlist");
    };
    let userWatchlist = switch (watchlist.get(caller)) {
      case (null) {
        let newWatchlist = Map.empty<Text, Float>();
        watchlist.add(caller, newWatchlist);
        newWatchlist;
      };
      case (?existing) { existing };
    };
    stockList.forEach(func(stock) { userWatchlist.add(stock.0, stock.1) });
  };

  public query ({ caller }) func getWatchlist() : async [(Text, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watchlist");
    };
    switch (watchlist.get(caller)) {
      case (null) { [] };
      case (?userWatchlist) { userWatchlist.toArray() };
    };
  };

  // Market data access
  public query ({ caller }) func getMarketData(symbol : Text) : async PriceDetails {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access market data");
    };
    switch (marketData.get(symbol)) {
      case (null) { Runtime.trap("Invalid symbol") };
      case (?data) { data };
    };
  };

  public query ({ caller }) func getAllMarketData() : async [PriceDetails] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access market data");
    };
    marketData.values().toArray();
  };

  // Aggregate read functions - restricted to authenticated users
  public query ({ caller }) func getAllOptionChainData() : async [(Text, OptionChainEntry)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access option chain data");
    };
    optionChainData.toArray();
  };

  public query ({ caller }) func getAllOpenHighScannerData() : async [(Text, PriceDetails)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access scanner data");
    };
    openHighScanner.toArray();
  };

  public query ({ caller }) func getAllOpenLowScannerData() : async [(Text, PriceDetails)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access scanner data");
    };
    openLowScanner.toArray();
  };

  public query ({ caller }) func getAllCandlestickPatterns() : async [(Text, CandlestickPattern)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access candlestick patterns");
    };
    candlestickPatterns.toArray();
  };
};
