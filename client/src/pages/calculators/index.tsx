import React, { useState } from 'react';
import './calculators.css';

const CalculatorsPage = () => {
    const [fdAmount, setFdAmount] = useState(0);
    const [fdRate, setFdRate] = useState(0);
    const [fdYears, setFdYears] = useState(1);
    const [fdResult, setFdResult] = useState(0);

    const calculateFD = () => {
        const result = fdAmount * Math.pow((1 + fdRate / 100), fdYears);
        setFdResult(result);
    };

    return (
        <div className="calculators-page">
            <h1>Financial Calculators</h1>
            <div className="calculator-section">
                <h2>Fixed Deposit Calculator</h2>
                <div className="calculator-form">
                    <label htmlFor="fd-amount">Principal Amount (₹)</label>
                    <input
                        id="fd-amount"
                        type="number"
                        value={fdAmount}
                        onChange={(e) => setFdAmount(Number(e.target.value))}
                        placeholder="Enter principal amount"
                    />

                    <label htmlFor="fd-rate">Rate of Interest (%)</label>
                    <input
                        id="fd-rate"
                        type="number"
                        value={fdRate}
                        onChange={(e) => setFdRate(Number(e.target.value))}
                        placeholder="Enter interest rate"
                    />

                    <label htmlFor="fd-years">Time Period (Years)</label>
                    <input
                        id="fd-years"
                        type="number"
                        value={fdYears}
                        onChange={(e) => setFdYears(Number(e.target.value))}
                        placeholder="Enter number of years"
                    />

                    <button onClick={calculateFD}>Calculate</button>
                </div>
                <div className="calculator-result">
                    <h3>Result: ₹{fdResult.toFixed(2)}</h3>
                </div>
            </div>

            {/* Additional calculators can be added here */}
        </div>
    );
};

export default CalculatorsPage;