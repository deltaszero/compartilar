'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const words = [
    'amor',
    'cuidado',
    'harmonia',
    'respeito',
    'organização'
];

export const CustomTypingEffect = () => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [text, setText] = useState('');
    const [delta, setDelta] = useState(200);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const tick = () => {
            const currentWord = words[currentWordIndex];
            
            if (isDeleting) {
                setText(currentWord.substring(0, text.length - 1));
                setDelta(100); // Faster when deleting
            } else {
                setText(currentWord.substring(0, text.length + 1));
                setDelta(200); // Slower when typing
            }

            if (!isDeleting && text === currentWord) {
                setTimeout(() => setIsDeleting(true), 2000); // Wait before starting to delete
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setDelta(500); // Pause before starting new word
                let nextWordIndex = currentWordIndex;
                while (nextWordIndex === currentWordIndex) {
                    nextWordIndex = Math.floor(Math.random() * words.length);
                }
                setCurrentWordIndex(nextWordIndex);
            }
            timeout = setTimeout(tick, delta);
        };

        timeout = setTimeout(tick, delta);
        return () => clearTimeout(timeout);
    }, [text, isDeleting, currentWordIndex, delta]);

    return (
        <div className="flex flex-col justify-start">
            <div>Plano parental,</div>
            <div className="flex items-center space-x-2">
                <span>um plano de</span>
                <div className="text-accent min-w-[400px] relative">
                    {text}
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ 
                            duration: 0.5, 
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute -right-[2px]"
                    >
                    </motion.span>
                    {/* add blinking pipe */}
                    <span className="animate-pulse">|</span>
                </div>
            </div>
        </div>
    );
};