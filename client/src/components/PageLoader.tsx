// client/src/components/PageLoader.tsx
import './PageLoader.css';

interface PageLoaderProps {
    message?: string;
    variant?: 'default' | 'minimal' | 'fullscreen';
}

export const PageLoader = ({
    message = 'Loading...',
    variant = 'fullscreen'
}: PageLoaderProps) => {
    return (
        <div className={`page-loader ${variant}`}>
            <div className="page-loader-content">
                {/* Animated Logo/Icon */}
                <div className="loader-icon">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <svg
                        className="loader-logo"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 2L2 7L12 12L22 7L12 2Z"
                            fill="currentColor"
                            opacity="0.8"
                        />
                        <path
                            d="M2 17L12 22L22 17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M2 12L12 17L22 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                {/* Loading Text */}
                <div className="loader-text">
                    <h3 className="loader-title">{message}</h3>
                    <div className="loader-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="loader-progress">
                    <div className="loader-progress-bar"></div>
                </div>
            </div>
        </div>
    );
};

// Minimal inline loader for small sections
export const InlineLoader = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    return (
        <div className={`inline-loader ${size}`}>
            <div className="inline-spinner"></div>
        </div>
    );
};

// Skeleton loader for content placeholders
export const SkeletonLoader = ({
    lines = 3,
    width = '100%'
}: {
    lines?: number;
    width?: string;
}) => {
    return (
        <div className="skeleton-loader" style={{ width }}>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="skeleton-line" style={{
                    width: i === lines - 1 ? '70%' : '100%'
                }}></div>
            ))}
        </div>
    );
};
