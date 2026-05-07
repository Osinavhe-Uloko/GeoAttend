import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface AttendanceSubmitButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  text?: string;
}

export const AttendanceSubmitButton: React.FC<AttendanceSubmitButtonProps> = ({
  onClick,
  isLoading,
  disabled,
  text = 'Mark Attendance',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2
        ${disabled || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <CheckCircle className="w-5 h-5" />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};
