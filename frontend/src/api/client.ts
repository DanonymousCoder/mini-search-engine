import type { DocumentDetail, ReindexResponse, SearchResponse, StatsResponse, RankMode } from './types';


export const PAGE_SIZE = 10;

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '/api';


export class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  
    get isOffline(): boolean {
      return this.code === 'network_error' || this.code === 'proxy_error';
    }
}

async 



