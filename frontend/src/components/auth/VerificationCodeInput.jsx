import { useState, useRef, useEffect } from 'react';
import { Box, TextField, Stack } from '@mui/material';

const VerificationCodeInput = ({ length = 6, value, onChange, error }) => {
    const [code, setCode] = useState(new Array(length).fill(''));
    const inputRefs = useRef([]);

    useEffect(() => {
        if (value && value.length === length) {
            setCode(value.split(''));
        }
    }, [value, length]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;

        const newCode = [...code];
        newCode[index] = element.value;
        setCode(newCode);

        if (element.value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        onChange(newCode.join(''));
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        
        if (!/^\d+$/.test(pastedData)) return;

        const newCode = pastedData.split('');
        while (newCode.length < length) newCode.push('');
        
        setCode(newCode);
        onChange(newCode.join(''));
        
        const lastFilledIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[lastFilledIndex]?.focus();
    };

    return (
        <Box>
            <Stack direction="row" spacing={1} justifyContent="center">
                {code.map((digit, index) => (
                    <TextField
                        key={index}
                        inputRef={(ref) => (inputRefs.current[index] = ref)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={digit}
                        onChange={(e) => handleChange(e.target, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        onFocus={(e) => e.target.select()}
                        error={!!error}
                        sx={{
                            width: { xs: 45, sm: 56 },
                            '& input': {
                                textAlign: 'center',
                                fontSize: { xs: '20px', sm: '24px' },
                                fontWeight: 600,
                                padding: { xs: '12px 0', sm: '16px 0' },
                            }
                        }}
                    />
                ))}
            </Stack>
            {error && (
                <Box sx={{ textAlign: 'center', mt: 1, color: 'error.main', fontSize: '14px' }}>
                    {error}
                </Box>
            )}
        </Box>
    );
};

export default VerificationCodeInput;

