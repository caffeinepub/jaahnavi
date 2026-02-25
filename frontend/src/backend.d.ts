import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PriceDetails {
    low: number;
    high: number;
    close: number;
    open: number;
    vwap: number;
}
export interface OptionChainEntry {
    atm: number;
    ce_atm_data: CEPEData;
    scenarios: ScenarioTags;
    pe_atm_data: CEPEData;
    price: PriceDetails;
    symbol: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface MarketSymbolData {
    oi: bigint;
    lastPrice: number;
    volume: bigint;
    changePercent: number;
    symbol: string;
}
export interface CEPEData {
    oi: number;
    doi: number;
    strike: string;
    trend: string;
    price: number;
    symbol: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ScenarioTags {
    trending: boolean;
    pcr_tested: boolean;
    high_oi: boolean;
    reversal: boolean;
}
export interface IndicesSnapshot {
    oi: bigint;
    lastPrice: number;
    name: string;
    volume: bigint;
    changePercent: number;
}
export interface CandlestickPattern {
    wick_low: number;
    patternType: string;
    wick_high: number;
    price: number;
}
export interface UserProfile {
    username: string;
    name: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addToWatchlist(stockList: Array<[string, number]>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bearishScanner(symbol: string): Promise<PriceDetails>;
    bullishScanner(symbol: string): Promise<PriceDetails>;
    getAllCandlestickPatterns(): Promise<Array<[string, CandlestickPattern]>>;
    getAllMarketData(): Promise<Array<PriceDetails>>;
    getAllMarketSymbols(): Promise<Array<MarketSymbolData>>;
    getAllOpenHighScannerData(): Promise<Array<[string, PriceDetails]>>;
    getAllOpenLowScannerData(): Promise<Array<[string, PriceDetails]>>;
    getAllOptionChainData(): Promise<Array<[string, OptionChainEntry]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCandlestickPattern(patternType: string): Promise<Array<CandlestickPattern>>;
    getIndicesSnapshot(): Promise<Array<IndicesSnapshot>>;
    getMarketData(symbol: string): Promise<PriceDetails>;
    getMarketSnapshot(): Promise<Array<MarketSymbolData>>;
    getMarketSymbolData(symbol: string): Promise<MarketSymbolData | null>;
    getOptionChain(symbol: string): Promise<string>;
    getOptionChainData(symbol: string): Promise<OptionChainEntry>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWatchlist(): Promise<Array<[string, number]>>;
    isCallerAdmin(): Promise<boolean>;
    refreshMarketData(): Promise<string>;
    registerUser(adminToken: string, userProvidedToken: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateMarketSymbolData(symbol: string, data: MarketSymbolData): Promise<void>;
}
