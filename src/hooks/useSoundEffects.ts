'use client';

import { useCallback, useRef } from 'react';

interface SoundEffects {
  [key: string]: HTMLAudioElement;
}

export const useSoundEffects = () => {
  const soundsRef = useRef<SoundEffects>({});
  const enabledRef = useRef(true);

  // Web Audio API 創建音效
  const createTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!enabledRef.current) return;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }, []);

  // 日式風鈴音效
  const playWindChime = useCallback(() => {
    const frequencies = [523.25, 659.25, 783.99, 880.00, 1046.50]; // C5, E5, G5, A5, C6
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        createTone(freq, 1.5, 'triangle');
      }, index * 100);
    });
  }, [createTone]);

  // 太鼓敲擊音效
  const playTaiko = useCallback((intensity: number = 1) => {
    const baseFreq = 60 * intensity;
    createTone(baseFreq, 0.3, 'sawtooth');
    setTimeout(() => {
      createTone(baseFreq * 0.7, 0.2, 'sawtooth');
    }, 50);
  }, [createTone]);

  // 櫻花飄落音效
  const playSakura = useCallback(() => {
    const frequencies = [440, 493.88, 523.25, 587.33];
    const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
    createTone(randomFreq, 2, 'triangle');
  }, [createTone]);

  // 金幣音效
  const playCoin = useCallback(() => {
    createTone(880, 0.1, 'square');
    setTimeout(() => {
      createTone(1320, 0.1, 'square');
    }, 50);
  }, [createTone]);

  // 成功音效 (勝利)
  const playSuccess = useCallback(() => {
    const melody = [
      { freq: 523.25, time: 0 },     // C5
      { freq: 659.25, time: 150 },   // E5
      { freq: 783.99, time: 300 },   // G5
      { freq: 1046.50, time: 450 },  // C6
    ];
    
    melody.forEach(({ freq, time }) => {
      setTimeout(() => {
        createTone(freq, 0.4, 'triangle');
      }, time);
    });
    
    // 加上和聲
    setTimeout(() => {
      createTone(523.25, 1, 'sine'); // C5 持續
      createTone(659.25, 1, 'sine'); // E5 持續
      createTone(783.99, 1, 'sine'); // G5 持續
    }, 200);
  }, [createTone]);

  // 失敗音效
  const playFail = useCallback(() => {
    createTone(220, 0.3, 'sawtooth');
    setTimeout(() => {
      createTone(196, 0.5, 'sawtooth');
    }, 200);
  }, [createTone]);

  // 按鈕點擊音效
  const playClick = useCallback(() => {
    createTone(800, 0.1, 'square');
  }, [createTone]);

  // 球碰撞音效
  const playBounce = useCallback((pitch: number = 1) => {
    const freq = 200 * pitch;
    createTone(freq, 0.1, 'triangle');
  }, [createTone]);

  // 開關音效
  const toggleSound = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    if (enabledRef.current) {
      playClick();
    }
  }, [playClick]);

  return {
    playWindChime,
    playTaiko,
    playSakura,
    playCoin,
    playSuccess,
    playFail,
    playClick,
    playBounce,
    toggleSound,
    isEnabled: () => enabledRef.current
  };
};