import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
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

  public type UserProfile = {
    name : Text;
    username : Text;
  };

  // Internal storage
  let optionChainData = Map.empty<Text, OptionChainEntry>();
  let openHighScanner = Map.empty<Text, PriceDetails>();
  let openLowScanner = Map.empty<Text, PriceDetails>();
  let candlestickPatterns = Map.empty<Text, CandlestickPattern>();
  let watchlist = Map.empty<Principal, Map.Map<Text, Float>>();
  let marketData = Map.empty<Text, PriceDetails>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Authentication and registration methods
  public shared ({ caller }) func registerUser(adminToken : Text, userProvidedToken : Text) : async () {
    AccessControl.initialize(accessControlState, caller, adminToken, userProvidedToken);
  };

  // Public query to get OI_MAP data, ensuring deep copy
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

  // Watchlist management
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
};

