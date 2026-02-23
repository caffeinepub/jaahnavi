import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface ScenarioTags {
    trending: boolean;
    pcr_tested: boolean;
    high_oi: boolean;
    reversal: boolean;
}
export interface CandlestickPattern {
    wick_low: number;
    patternType: string;
    wick_high: number;
    price: number;
}
export interface CEPEData {
    oi: number;
    doi: number;
    strike: string;
    trend: string;
    price: number;
    symbol: string;
}
export interface UserProfile {
    username: string;
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
    getAllMarketData(): Promise<Array<PriceDetails>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCandlestickPattern(patternType: string): Promise<Array<CandlestickPattern>>;
    getMarketData(symbol: string): Promise<PriceDetails>;
    getOptionChainData(symbol: string): Promise<OptionChainEntry>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWatchlist(): Promise<Array<[string, number]>>;
    isCallerAdmin(): Promise<boolean>;
    registerUser(adminToken: string, userProvidedToken: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
