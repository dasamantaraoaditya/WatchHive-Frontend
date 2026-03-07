// API response types
export interface ApiError {
    error: string;
    details?: Array<{
        field?: string;
        message: string;
    }>;
}

export interface ApiResponse<T> {
    data?: T;
    error?: ApiError;
}
