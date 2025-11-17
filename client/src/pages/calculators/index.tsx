import React, { useState } from 'react';
import { Calculator, TrendingUp, PiggyBank, Home, Car, CreditCard, Percent, Calendar, DollarSign, Target, Briefcase, Clock, LucideIcon } from 'lucide-react';
import './calculators.css';

// Interface for our calculator data
interface ICalculator {
    id: string;
    name: string;
    icon: LucideIcon;
    color: string;
    description: string;
}

// Interface for the CalculatorContent component's props
interface CalculatorContentProps {
    calculatorId: string;
    onBack: () => void;
    calculatorData: ICalculator;
}

export const FinancialCalculators: React.FC = () => {
    const [selectedCalculator, setSelectedCalculator] = useState<string | null>(null);

    // Calculator data
    const calculators: ICalculator[] = [
        { id: 'fd', name: 'Fixed Deposit', icon: PiggyBank, color: '#10b981', description: 'Calculate FD maturity amount' },
        { id: 'rd', name: 'Recurring Deposit', icon: Calendar, color: '#3b82f6', description: 'Calculate RD returns' },
        { id: 'emi', name: 'Loan EMI', icon: Home, color: '#8b5cf6', description: 'Home, car & personal loans' },
        { id: 'interest', name: 'Interest Calculator', icon: Percent, color: '#f59e0b', description: 'Simple & compound interest' },
        { id: 'roi', name: 'ROI Calculator', icon: TrendingUp, color: '#ef4444', description: 'Return on investment' },
        { id: 'sip', name: 'SIP Calculator', icon: Target, color: '#ec4899', description: 'Mutual fund SIP returns' },
        { id: 'ppf', name: 'PPF Calculator', icon: Briefcase, color: '#06b6d4', description: 'Public Provident Fund' },
        { id: 'retirement', name: 'Retirement', icon: Clock, color: '#84cc16', description: 'Retirement planning' },
    ];

    return (
        <div className="calc-page-container">
            <div className="calc-page-content">
                {/* Header */}
                <div className="calc-header">
                    <h1>
                        🧮 Financial Calculators
                    </h1>
                    <p>
                        Make informed financial decisions with our comprehensive calculators
                    </p>
                </div>

                {!selectedCalculator ? (
                    /* Calculator Grid */
                    <div className="calc-grid">
                        {calculators.map(calc => {
                            const Icon = calc.icon;
                            return (
                                <div
                                    key={calc.id}
                                    onClick={() => setSelectedCalculator(calc.id)}
                                    className="calc-card"
                                    // Pass dynamic color to CSS via a CSS variable
                                    style={{ '--calc-color': calc.color } as React.CSSProperties}
                                >
                                    <div className="calc-icon-wrapper">
                                        <Icon size={32} color="white" />
                                    </div>
                                    <h3>{calc.name}</h3>
                                    <p className="calc-card-desc">{calc.description}</p>
                                    <div className="calc-card-link">
                                        Calculate Now →
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Calculator Content */
                    <CalculatorContent
                        calculatorId={selectedCalculator}
                        onBack={() => setSelectedCalculator(null)}
                        calculatorData={calculators.find(c => c.id === selectedCalculator)!}
                    />
                )}
            </div>
        </div>
    );
};

// Individual Calculator Component
const CalculatorContent: React.FC<CalculatorContentProps> = ({ calculatorId, onBack, calculatorData }) => {
    // Type for inputs state
    const [inputs, setInputs] = useState<{ [key: string]: string | number }>({});
    // Type for result state. 'any' is acceptable here due to the dynamic structure.
    const [result, setResult] = useState<any | null>(null);

    const handleInputChange = (key: string, value: string) => {
        // Keep the original logic, but now it's typed
        const numericValue = parseFloat(value);
        setInputs(prev => ({
            ...prev,
            [key]: isNaN(numericValue) ? value : numericValue
        }));
    };

    const calculate = () => {
        let calculatedResult: any = null;

        switch (calculatorId) {
            case 'fd':
                const fdAmount = (inputs.principal as number) || 0;
                const fdRate = ((inputs.rate as number) || 0) / 100;
                const fdYears = (inputs.years as number) || 1;
                const fdCompoundFreq = (inputs.frequency as number) || 4; // Quarterly
                const maturity = fdAmount * Math.pow(1 + fdRate / fdCompoundFreq, fdCompoundFreq * fdYears);
                calculatedResult = {
                    maturityAmount: maturity,
                    interestEarned: maturity - fdAmount,
                    totalInvestment: fdAmount
                };
                break;

            case 'rd':
                // Your RD formula seems complex and possibly incorrect (e.g., -1/3 exponent).
                // Using a standard formula: M = P * [((1 + r)^n - 1) / r]
                const rdMonthly = (inputs.monthly as number) || 0;
                const rdRate = ((inputs.rate as number) || 0) / 100 / 12; // Monthly rate
                const rdMonths = ((inputs.years as number) || 1) * 12;
                const rdMaturity = rdMonthly * ((Math.pow(1 + rdRate, rdMonths) - 1) / rdRate);
                calculatedResult = {
                    maturityAmount: rdMaturity,
                    totalInvestment: rdMonthly * rdMonths,
                    interestEarned: rdMaturity - (rdMonthly * rdMonths)
                };
                break;

            case 'emi':
                const principal = (inputs.principal as number) || 0;
                const monthlyRate = ((inputs.rate as number) || 0) / 100 / 12;
                const months = ((inputs.years as number) || 1) * 12;
                if (monthlyRate > 0) {
                    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
                    calculatedResult = {
                        emi: emi,
                        totalPayment: emi * months,
                        totalInterest: (emi * months) - principal,
                        principal: principal
                    };
                } else {
                    calculatedResult = { emi: principal / months, totalPayment: principal, totalInterest: 0, principal: principal };
                }
                break;

            case 'interest':
                const p = (inputs.principal as number) || 0;
                const r = ((inputs.rate as number) || 0) / 100;
                const t = (inputs.years as number) || 1;
                const isCompound = inputs.type === 'compound';

                if (isCompound) {
                    const n = (inputs.frequency as number) || 1;
                    const compound = p * Math.pow(1 + r / n, n * t);
                    calculatedResult = {
                        finalAmount: compound,
                        interest: compound - p,
                        type: 'Compound Interest'
                    };
                } else {
                    const simple = p * (1 + r * t);
                    calculatedResult = {
                        finalAmount: simple,
                        interest: simple - p,
                        type: 'Simple Interest'
                    };
                }
                break;

            case 'roi':
                const investment = (inputs.investment as number) || 0;
                const returnAmount = (inputs.returns as number) || 0;
                const roiPercent = investment === 0 ? 0 : ((returnAmount - investment) / investment) * 100;
                calculatedResult = {
                    roi: roiPercent,
                    profit: returnAmount - investment,
                    investment: investment
                };
                break;

            case 'sip':
                const sipMonthly = (inputs.monthly as number) || 0;
                const sipRate = ((inputs.expectedReturn as number) || 12) / 100 / 12;
                const sipMonths = ((inputs.years as number) || 1) * 12;
                // Standard SIP formula (Future Value of a series)
                const sipMaturity = sipMonthly * ((Math.pow(1 + sipRate, sipMonths) - 1) / sipRate) * (1 + sipRate);
                calculatedResult = {
                    maturityAmount: sipMaturity,
                    invested: sipMonthly * sipMonths,
                    returns: sipMaturity - (sipMonthly * sipMonths)
                };
                break;

            case 'ppf':
                const ppfYearly = (inputs.yearly as number) || 0;
                const ppfRate = 7.1 / 100; // Hardcoded PPF rate
                const ppfYears = (inputs.years as number) || 15;
                let ppfTotal = 0;
                // Assuming investment at the beginning of the year
                for (let i = 0; i < ppfYears; i++) {
                    ppfTotal = (ppfTotal + ppfYearly) * (1 + ppfRate);
                }
                calculatedResult = {
                    maturityAmount: ppfTotal,
                    invested: ppfYearly * ppfYears,
                    interest: ppfTotal - (ppfYearly * ppfYears)
                };
                break;

            case 'retirement':
                // Note: This is a simplified calculation.
                const currentAge = (inputs.currentAge as number) || 30;
                const retirementAge = (inputs.retirementAge as number) || 60;
                const monthlyExpense = (inputs.monthlyExpense as number) || 50000;
                const inflation = ((inputs.inflation as number) || 6) / 100;
                const returnRate = ((inputs.returnRate as number) || 12) / 100;

                const yearsToRetirement = retirementAge - currentAge;

                // Calculate future value of monthly expenses at retirement
                const futureExpense = monthlyExpense * Math.pow(1 + inflation, yearsToRetirement);

                // Calculate corpus required using a different, more standard PVA formula
                // Assuming 25 years post-retirement (e.g., age 60 to 85)
                const yearsInRetirement = 25;
                const realReturnRate = (1 + returnRate) / (1 + inflation) - 1;
                const corpusRequired = (futureExpense * 12) * (1 - Math.pow(1 + realReturnRate, -yearsInRetirement)) / realReturnRate;

                // Calculate monthly SIP needed to reach the corpus
                const monthlyReturnRate = returnRate / 12;
                const monthsToRetirement = yearsToRetirement * 12;
                const monthlySIP = corpusRequired * (monthlyReturnRate / (Math.pow(1 + monthlyReturnRate, monthsToRetirement) - 1));

                calculatedResult = {
                    corpusRequired: corpusRequired,
                    monthlySIP: monthlySIP,
                    totalInvestment: monthlySIP * monthsToRetirement,
                    futureExpense: futureExpense
                };
                break;
        }

        setResult(calculatedResult);
    };

    const renderInputs = () => {
        const inputConfigs: { [key: string]: any[] } = {
            fd: [
                { key: 'principal', label: 'Principal Amount (₹)', type: 'number', placeholder: '100000' },
                { key: 'rate', label: 'Interest Rate (% per annum)', type: 'number', placeholder: '6.5', step: '0.1' },
                { key: 'years', label: 'Time Period (Years)', type: 'number', placeholder: '5' },
                {
                    key: 'frequency', label: 'Compounding', type: 'select', options: [
                        { value: 1, label: 'Annually' },
                        { value: 2, label: 'Semi-annually' },
                        { value: 4, label: 'Quarterly' },
                        { value: 12, label: 'Monthly' }
                    ]
                }
            ],
            rd: [
                { key: 'monthly', label: 'Monthly Deposit (₹)', type: 'number', placeholder: '5000' },
                { key: 'rate', label: 'Interest Rate (% per annum)', type: 'number', placeholder: '6.5', step: '0.1' },
                { key: 'years', label: 'Time Period (Years)', type: 'number', placeholder: '5' }
            ],
            emi: [
                { key: 'principal', label: 'Loan Amount (₹)', type: 'number', placeholder: '1000000' },
                { key: 'rate', label: 'Interest Rate (% per annum)', type: 'number', placeholder: '8.5', step: '0.1' },
                { key: 'years', label: 'Loan Tenure (Years)', type: 'number', placeholder: '20' }
            ],
            interest: [
                { key: 'principal', label: 'Principal Amount (₹)', type: 'number', placeholder: '100000' },
                { key: 'rate', label: 'Interest Rate (% per annum)', type: 'number', placeholder: '10', step: '0.1' },
                { key: 'years', label: 'Time Period (Years)', type: 'number', placeholder: '5' },
                {
                    key: 'type', label: 'Interest Type', type: 'select', options: [
                        { value: 'simple', label: 'Simple Interest' },
                        { value: 'compound', label: 'Compound Interest' }
                    ]
                },
                {
                    key: 'frequency', label: 'Compounding Frequency', type: 'select', options: [
                        { value: 1, label: 'Annually' },
                        { value: 2, label: 'Semi-annually' },
                        { value: 4, label: 'Quarterly' },
                        { value: 12, label: 'Monthly' }
                    ], showIf: () => inputs.type === 'compound'
                }
            ],
            roi: [
                { key: 'investment', label: 'Initial Investment (₹)', type: 'number', placeholder: '100000' },
                { key: 'returns', label: 'Final Value (₹)', type: 'number', placeholder: '150000' }
            ],
            sip: [
                { key: 'monthly', label: 'Monthly Investment (₹)', type: 'number', placeholder: '10000' },
                { key: 'expectedReturn', label: 'Expected Return (% p.a.)', type: 'number', placeholder: '12', step: '0.1' },
                { key: 'years', label: 'Investment Period (Years)', type: 'number', placeholder: '10' }
            ],
            ppf: [
                { key: 'yearly', label: 'Yearly Investment (₹)', type: 'number', placeholder: '150000' },
                { key: 'years', label: 'Investment Period (Years)', type: 'number', placeholder: '15', min: 15 }
            ],
            retirement: [
                { key: 'currentAge', label: 'Current Age', type: 'number', placeholder: '30' },
                { key: 'retirementAge', label: 'Retirement Age', type: 'number', placeholder: '60' },
                { key: 'monthlyExpense', label: 'Current Monthly Expense (₹)', type: 'number', placeholder: '50000' },
                { key: 'inflation', label: 'Expected Inflation (% p.a.)', type: 'number', placeholder: '6', step: '0.1' },
                { key: 'returnRate', label: 'Expected Return (% p.a.)', type: 'number', placeholder: '12', step: '0.1' }
            ]
        };

        const config = inputConfigs[calculatorId] || [];

        return config.map((input: any) => {
            if (input.showIf && !input.showIf()) return null;

            return (
                <div key={input.key} className="calc-input-group">
                    <label className="calc-input-label">
                        {input.label}
                    </label>
                    {input.type === 'select' ? (
                        <select
                            value={inputs[input.key] || ''}
                            onChange={(e) => handleInputChange(input.key, e.target.value)}
                            className="calc-select-field"
                        >
                            <option value="">Select...</option>
                            {input.options.map((opt: any) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={input.type}
                            value={inputs[input.key] || ''}
                            onChange={(e) => handleInputChange(input.key, e.target.value)}
                            placeholder={input.placeholder}
                            step={input.step}
                            min={input.min}
                            className="calc-input-field"
                        />
                    )}
                </div>
            );
        });
    };

    const renderResult = () => {
        if (!result) return null;

        const resultConfigs: { [key: string]: any[] } = {
            fd: [
                { label: 'Maturity Amount', value: result.maturityAmount, color: '#10b981' },
                { label: 'Interest Earned', value: result.interestEarned, color: '#3b82f6' },
                { label: 'Total Investment', value: result.totalInvestment, color: '#6b7280' }
            ],
            rd: [
                { label: 'Maturity Amount', value: result.maturityAmount, color: '#10b981' },
                { label: 'Total Investment', value: result.totalInvestment, color: '#6b7280' },
                { label: 'Interest Earned', value: result.interestEarned, color: '#3b82f6' }
            ],
            emi: [
                { label: 'Monthly EMI', value: result.emi, color: '#ef4444' },
                { label: 'Total Payment', value: result.totalPayment, color: '#6b7280' },
                { label: 'Total Interest', value: result.totalInterest, color: '#f59e0b' },
                { label: 'Principal', value: result.principal, color: '#10b981' }
            ],
            interest: [
                { label: 'Final Amount', value: result.finalAmount, color: '#10b981' },
                { label: 'Interest Earned', value: result.interest, color: '#3b82f6' },
                { label: 'Type', value: result.type, isText: true, color: '#6b7280' }
            ],
            roi: [
                { label: 'ROI', value: result.roi, isSuffix: '%', color: result.roi >= 0 ? '#10b981' : '#ef4444' },
                { label: 'Profit/Loss', value: result.profit, color: result.profit >= 0 ? '#10b981' : '#ef4444' },
                { label: 'Investment', value: result.investment, color: '#6b7280' }
            ],
            sip: [
                { label: 'Maturity Amount', value: result.maturityAmount, color: '#10b981' },
                { label: 'Amount Invested', value: result.invested, color: '#6b7280' },
                { label: 'Estimated Returns', value: result.returns, color: '#3b82f6' }
            ],
            ppf: [
                { label: 'Maturity Amount', value: result.maturityAmount, color: '#10b981' },
                { label: 'Amount Invested', value: result.invested, color: '#6b7280' },
                { label: 'Interest Earned', value: result.interest, color: '#3b82f6' }
            ],
            retirement: [
                { label: 'Required Corpus', value: result.corpusRequired, color: '#ef4444' },
                { label: 'Monthly SIP Needed', value: result.monthlySIP, color: '#f59e0b' },
                { label: 'Total Investment', value: result.totalInvestment, color: '#6b7280' },
                { label: 'Future Monthly Expense', value: result.futureExpense, color: '#3b82f6' }
            ]
        };

        const config = resultConfigs[calculatorId] || [];

        return (
            <div className="calc-result-box">
                <h3>📊 Results</h3>
                <div className="calc-result-grid">
                    {config.map((item, index) => (
                        <div
                            key={index}
                            className="calc-result-item"
                            style={{
                                background: `${item.color}15`,
                                borderLeftColor: item.color
                            }}
                        >
                            <div className="calc-result-item-label">
                                {item.label}
                            </div>
                            <div className="calc-result-item-value" style={{ color: item.color }}>
                                {item.isText
                                    ? item.value
                                    : `₹${item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                                {item.isSuffix && item.isSuffix}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            <button onClick={onBack} className="calc-back-button">
                ← Back to Calculators
            </button>

            <div className="calc-content-grid">
                {/* Input Section */}
                <div
                    className="calc-input-section"
                    style={{ '--calc-color': calculatorData.color } as React.CSSProperties}
                >
                    <div className="calc-input-header">
                        <div className="calc-input-icon">
                            <calculatorData.icon size={24} color="white" />
                        </div>
                        <div className="calc-input-title">
                            <h2>{calculatorData.name}</h2>
                            <p>{calculatorData.description}</p>
                        </div>
                    </div>

                    {renderInputs()}

                    <button onClick={calculate} className="calc-calculate-button">
                        Calculate
                    </button>
                </div>

                {/* Result Section */}
                <div>
                    {result ? renderResult() : (
                        <div className="calc-result-placeholder">
                            <Calculator size={64} className="calc-result-placeholder-icon" />
                            <p>
                                Enter values and click Calculate to see results
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

