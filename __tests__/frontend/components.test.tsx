import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Stepper from '../../components/pipeline/Stepper';
import StepAction from '../../components/pipeline/StepAction';
import CharacterCard from '../../components/cards/CharacterCard';

describe('Frontend UI Components', () => {
  describe('Stepper Component', () => {
    it('renders all 5 pipeline step labels', () => {
      const stepStates = { 0: 'done', 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' };
      render(<Stepper currentStep={1} stepStates={stepStates} />);

      expect(screen.getByText('Style')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Portraits')).toBeInTheDocument();
      expect(screen.getByText('Chapters')).toBeInTheDocument();
      expect(screen.getByText('Illustrations')).toBeInTheDocument();
    });

    it('displays checkmark icon for completed steps', () => {
      const stepStates = { 0: 'done', 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' };
      render(<Stepper currentStep={1} stepStates={stepStates} />);

      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('StepAction Component', () => {
    const dummyHandlers = {
      onRunStep: jest.fn(),
      onRetryStep: jest.fn(),
      onResetStep: jest.fn(),
    };

    it('renders Run button for idle step', () => {
      render(
        <StepAction
          currentStep={0}
          stepState="pending"
          stepError={null}
          stepStartedAt={null}
          loading={false}
          {...dummyHandlers}
        />
      );

      expect(screen.getByText(/Run Step 1: Art Style/i)).toBeInTheDocument();
    });

    it('renders Retry button and error message when step fails', () => {
      render(
        <StepAction
          currentStep={1}
          stepState="failed"
          stepError="API quota exceeded"
          stepStartedAt={null}
          loading={false}
          {...dummyHandlers}
        />
      );

      expect(screen.getByText(/Retry Step 2: Character Prompts/i)).toBeInTheDocument();
      expect(screen.getByText(/API quota exceeded/i)).toBeInTheDocument();
    });

    it('renders Reset button when step is stranded in progress for >5 mins', () => {
      const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      render(
        <StepAction
          currentStep={2}
          stepState="running"
          stepError={null}
          stepStartedAt={oldTimestamp}
          loading={false}
          {...dummyHandlers}
        />
      );

      expect(screen.getByText(/Step appears stuck/i)).toBeInTheDocument();
      expect(screen.getByText(/Reset & Retry Step 3/i)).toBeInTheDocument();
    });
  });

  describe('CharacterCard Component', () => {
    it('renders character name and prompt correctly', () => {
      const char = { name: 'Mr. Toad', prompt: 'A flamboyant toad in a driving suit' };
      render(<CharacterCard character={char} />);

      expect(screen.getByText('Mr. Toad')).toBeInTheDocument();
      expect(screen.getByText('A flamboyant toad in a driving suit')).toBeInTheDocument();
    });
  });
});
