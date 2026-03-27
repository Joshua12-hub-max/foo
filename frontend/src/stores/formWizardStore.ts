import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { JsonValue } from '@/types';

export interface WizardStep {
  id: string; // unique identifier for the step (e.g., 'personal-info', 'review')
  title: string;
  isComplete: boolean;
  isValid: boolean;
  component?: string;
}

interface FormWizardState {
  currentStepIndex: number;
  steps: WizardStep[];
  formData: Record<string, JsonValue>;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

interface FormWizardActions {
  initWizard: (steps: WizardStep[], initialData?: Record<string, JsonValue>) => void;
  nextStep: () => boolean; // Returns success
  prevStep: () => boolean; // Returns success
  goToStep: (index: number) => void;
  updateFormData: (data: Record<string, JsonValue>) => void;
  setStepValidity: (stepIndex: number, isValid: boolean) => void;
  setStepCompletion: (stepIndex: number, isComplete: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  resetWizard: () => void;
  getCurrentStep: () => WizardStep | undefined;
}

type FormWizardStore = FormWizardState & FormWizardActions;

const initialState: FormWizardState = {
  currentStepIndex: 0,
  steps: [],
  formData: {},
  isSubmitting: false,
  errors: {},
};

export const useFormWizardStore = create<FormWizardStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initWizard: (steps, initialData = {}) => {
        set({
          ...initialState,
          steps,
          formData: initialData,
        });
      },

      nextStep: () => {
        const { currentStepIndex, steps } = get();
        if (currentStepIndex < steps.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
          return true;
        }
        return false;
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
          return true;
        }
        return false;
      },

      goToStep: (index) => {
        const { steps } = get();
        if (index >= 0 && index < steps.length) {
              set({ currentStepIndex: index });
        }
      },

      updateFormData: (data) => {
        set((state) => ({
          formData: { ...state.formData, ...data },
        }));
      },

      setStepValidity: (stepIndex, isValid) => {
        set((state) => {
            const newSteps = [...state.steps];
            if (newSteps[stepIndex]) {
                newSteps[stepIndex].isValid = isValid;
            }
            return { steps: newSteps };
        });
      },

      setStepCompletion: (stepIndex, isComplete) => {
          set((state) => {
              const newSteps = [...state.steps];
              if (newSteps[stepIndex]) {
                  newSteps[stepIndex].isComplete = isComplete;
              }
              return { steps: newSteps };
          });
      },

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setErrors: (errors) => set({ errors }),

      clearError: (field) => {
        set((state) => {
            const newErrors = { ...state.errors };
            delete newErrors[field];
            return { errors: newErrors };
        });
      },

      resetWizard: () => set(initialState),

      getCurrentStep: () => {
          const { steps, currentStepIndex } = get();
          return steps[currentStepIndex];
      }
    }),
    { name: 'form-wizard-store' }
  )
);
