import React, { Component } from 'react';
 
import { SavingsGoal as SavingsGoalType, fetchSavingsGoals, addSavingsGoal, deleteSavingsGoal } from '../../services/api';
import { PiggyBank, Trash2, PlusCircle } from 'lucide-react';
import './SavingsGoals.css';
import { useAuth } from '../contexts/AuthContext';

// Define Prop and State types for the class component
interface SavingsGoalsProps {
  userId: string;
  onGoalsChange?: (goals: SavingsGoalType[]) => void;
}

interface SavingsGoalsState {
  goals: SavingsGoalType[];
  goalName: string;
  targetAmount: string;
  targetDate: string;
  isLoading: boolean;
  error: string | null;
}

class SavingsGoalsClass extends Component<SavingsGoalsProps, SavingsGoalsState> {
  state: SavingsGoalsState = {
    goals: [],
    goalName: '',
    targetAmount: '',
    targetDate: '',
    isLoading: true,
    error: null,
  };

  // Fetch goals when the component mounts
  async componentDidMount() {
    this.loadGoals();
  }

  loadGoals = async () => {
    try {
      this.setState({ isLoading: true, error: null });
      const goals = await fetchSavingsGoals(this.props.userId);
      this.setState({ goals, isLoading: false });
      // Notify parent (if provided) of initial goals list
      if (this.props.onGoalsChange) this.props.onGoalsChange(goals);
    } catch (err) {
      this.setState({ error: 'Failed to load savings goals.', isLoading: false });
      console.error(err);
    }
  };

  // Handle form input changes
  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    this.setState({ [name]: value } as any);
  };

  // Handle form submission to add a new goal
  handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { goalName, targetAmount, targetDate } = this.state;

    const newGoal = {
      userId: this.props.userId,
      goalName,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      targetDate: new Date(targetDate),
    };

    try {
      const addedGoal = await addSavingsGoal(newGoal);
      this.setState((prevState) => ({
        goals: [...prevState.goals, addedGoal],
        goalName: '',
        targetAmount: '',
        targetDate: '',
      }));
      if (this.props.onGoalsChange) this.props.onGoalsChange([...this.state.goals, addedGoal]);
    } catch (err) {
      console.error("Failed to add goal:", err);
      this.setState({ error: 'Failed to add the new goal.' });
    }
  };

  // Handle deleting a goal
  handleDelete = async (goalId: string) => {
    if (!goalId) return;
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteSavingsGoal(goalId);
        this.setState((prevState) => ({
          goals: prevState.goals.filter((goal) => goal._id !== goalId),
        }));
        if (this.props.onGoalsChange) this.props.onGoalsChange(this.state.goals.filter((goal) => goal._id !== goalId));
      } catch (err) {
        console.error("Failed to delete goal:", err);
        this.setState({ error: 'Failed to delete the goal.' });
      }
    }
  };

  // Note: The 'contributeToGoal' functionality would require another form/modal.
  // This is a placeholder for where you might add it.

  render() {
    const { goals, goalName, targetAmount, targetDate, isLoading, error } = this.state;

    return (
      <div className="savings-goals-container">
        <div className="savings-header">
          <div className="savings-icon">
            <PiggyBank size={22} />
          </div>
          <h2 className="savings-title">Savings Goals</h2>
        </div>

        {/* Form to Add New Goal */}
        <form onSubmit={this.handleSubmit} className="goal-form">
          <div className="form-field">
            <input
              type="text"
              name="goalName"
              className="input form-input form-input-animated "
              placeholder="Goal Name (e.g., New Laptop)"
              value={goalName}
              onChange={this.handleChange}
              required
            />
          </div>
          <div className="form-field">
            <input
              type="number"
              name="targetAmount"
              className='input form-input form-input-animated'
              placeholder="Target Amount"
              value={targetAmount}
              onChange={this.handleChange}
              required
              min="1"
            />
          </div>
          <div className="form-field">
            <input
              type="date"
              name="targetDate"
              className='input form-input form-input-animated'
              value={targetDate}
              onChange={this.handleChange}
              required
            />
          </div>
          <button type="submit" className="button">
            <PlusCircle size={16} /> Add Goal
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {/* List of Goals */}
        <div className="goals-list">
          {isLoading ? (
            <p>Loading goals...</p>
          ) : goals.length > 0 ? (
            goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <div key={goal._id} className="goal-item">
                  <div className="goal-item-header">
                    <span className="goal-name">{goal.goalName}</span>
                    <button onClick={() => this.handleDelete(goal._id!)} className="btn-delete-goal" title="Delete Goal">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="goal-amounts">
                    <span className="current-amount">₹{goal.currentAmount.toFixed(2)}</span> / ₹{goal.targetAmount.toFixed(2)}
                  </div>
                  <div className="goal-progress-bar">
                    <div className="goal-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                  </div>
                  <div className="goal-footer">
                    <span>{progress.toFixed(1)}% Complete</span>
                    <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="empty-goals">No savings goals yet. Add one to get started!</p>
          )}
        </div>
      </div>
    );
  }
}

const SavingsGoals = (props: { onGoalsChange?: (goals: SavingsGoalType[]) => void }) => {
  const { user } = useAuth();
  return <SavingsGoalsClass userId={user?._id ?? ''} onGoalsChange={props.onGoalsChange} />;
};

export default SavingsGoals;