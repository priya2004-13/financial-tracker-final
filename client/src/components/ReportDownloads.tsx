// client/src/components/ReportDownloads.tsx
import React, { useState } from 'react';
 
import {
    downloadFinancialReport,
    downloadMonthlySummary,
    getReportSummaryData
} from '../../services/report-service';
import './ReportDownloads.css';
import { useAuth } from '../contexts/AuthContext';

interface ReportDownloadsProps {
    startDate?: string;
    endDate?: string;
}

const ReportDownloads: React.FC<ReportDownloadsProps> = ({ startDate, endDate }) => {
    const { user } = useAuth();
    const [loadingReport, setLoadingReport] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleDownloadFullReport = async () => {
        if (!user) return;

        setLoadingReport(true);
        setError(null);
        setSuccess(null);

        try {
            await downloadFinancialReport(user._id, startDate || '', endDate || '');
            setSuccess('Financial report downloaded successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error downloading report:', err);
            setError('Failed to download report. Please try again.');
        } finally {
            setLoadingReport(false);
        }
    };

    const handleDownloadMonthlySummary = async () => {
        if (!user) return;

        setLoadingSummary(true);
        setError(null);
        setSuccess(null);

        try {
            await downloadMonthlySummary(user._id, startDate || '', endDate || '');
            setSuccess('Monthly summary downloaded successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error downloading summary:', err);
            setError('Failed to download summary. Please try again.');
        } finally {
            setLoadingSummary(false);
        }
    };

    return (
        <div className="report-downloads-container">
            <div className="report-header">
                <h2 className="report-title">
                    <span className="report-icon">📄</span>
                    Download Reports
                </h2>
                <p className="report-description">
                    Generate professional PDF reports of your financial data
                </p>
            </div>

            {error && (
                <div className="report-notification error">
                    <span className="notification-icon">⚠</span>
                    {error}
                </div>
            )}

            {success && (
                <div className="report-notification success">
                    <span className="notification-icon">✓</span>
                    {success}
                </div>
            )}

            <div className="report-options">
                <div className="report-card">
                    <div className="report-card-icon comprehensive">📊</div>
                    <div className="report-card-content">
                        <h3 className="report-card-title">Comprehensive Report</h3>
                        <p className="report-card-description">
                            Detailed analysis including transactions, insights, trends, and budget analysis
                        </p>
                        <ul className="report-features">
                            <li>✓ Complete transaction history</li>
                            <li>✓ AI-powered insights</li>
                            <li>✓ Category breakdowns</li>
                            <li>✓ Budget progress tracking</li>
                            <li>✓ Savings goals overview</li>
                        </ul>
                    </div>
                    <button
                        onClick={handleDownloadFullReport}
                        disabled={loadingReport || loadingSummary}
                        className="download-report-btn comprehensive"
                    >
                        {loadingReport ? (
                            <>
                                <span className="btn-spinner"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">⬇</span>
                                Download Full Report
                            </>
                        )}
                    </button>
                </div>

                <div className="report-card">
                    <div className="report-card-icon summary">📋</div>
                    <div className="report-card-content">
                        <h3 className="report-card-title">Monthly Summary</h3>
                        <p className="report-card-description">
                            Quick one-page overview with key metrics and highlights
                        </p>
                        <ul className="report-features">
                            <li>✓ Income vs Expenses</li>
                            <li>✓ Top spending categories</li>
                            <li>✓ Savings rate</li>
                            <li>✓ Key insights</li>
                            <li>✓ Quick overview</li>
                        </ul>
                    </div>
                    <button
                        onClick={handleDownloadMonthlySummary}
                        disabled={loadingReport || loadingSummary}
                        className="download-report-btn summary"
                    >
                        {loadingSummary ? (
                            <>
                                <span className="btn-spinner"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">⬇</span>
                                Download Summary
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="report-note">
                <span className="note-icon">ℹ</span>
                <p>
                    Reports include data from {startDate || 'the beginning'} to {endDate || 'today'}.
                    Adjust date filters to customize your report period.
                </p>
            </div>
        </div>
    );
};

export default ReportDownloads;
