import { useState } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CalculatorSectionProps {
  onBack: () => void;
}

const CalculatorSection = ({ onBack }: CalculatorSectionProps) => {
  const [display, setDisplay] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplay(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.');
      setWaitingForSecondOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      setDisplay(String(result));
      setFirstOperand(result);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '×':
        return first * second;
      case '÷':
        return second !== 0 ? first / second : 0;
      case '%':
        return (first * second) / 100;
      default:
        return second;
    }
  };

  const handleEquals = () => {
    if (operator && firstOperand !== null) {
      const inputValue = parseFloat(display);
      const result = calculate(firstOperand, inputValue, operator);
      setDisplay(String(result));
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(false);
    }
  };

  const handleBackspace = () => {
    if (display.length === 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const buttons = [
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const handleButton = (btn: string) => {
    if (btn >= '0' && btn <= '9') {
      inputDigit(btn);
    } else if (btn === '.') {
      inputDecimal();
    } else if (btn === 'C') {
      clear();
    } else if (btn === '⌫') {
      handleBackspace();
    } else if (btn === '=') {
      handleEquals();
    } else {
      handleOperator(btn);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Calculator</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Display */}
          <div className="bg-muted rounded-lg p-4 mb-4 text-right">
            <p className="text-3xl font-mono font-bold text-foreground truncate">
              {display}
            </p>
            {operator && (
              <p className="text-sm text-muted-foreground">
                {firstOperand} {operator}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            {buttons.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-2">
                {row.map((btn) => {
                  const isOperator = ['+', '-', '×', '÷', '%'].includes(btn);
                  const isEquals = btn === '=';
                  const isZero = btn === '0';
                  
                  return (
                    <Button
                      key={btn}
                      variant={isOperator ? 'secondary' : isEquals ? 'default' : 'outline'}
                      className={`h-14 text-xl font-semibold ${isZero ? 'col-span-2' : ''}`}
                      onClick={() => handleButton(btn)}
                    >
                      {btn === '⌫' ? <Delete className="h-5 w-5" /> : btn}
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• Use % for percentage calculations</p>
          <p>• Example: 1000 × 10% = 100</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorSection;
