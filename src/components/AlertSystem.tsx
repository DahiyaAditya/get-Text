import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, AlertTriangle, Clock } from 'lucide-react';
import { TodoItem } from '../types';

interface AlertSystemProps {
  todos: TodoItem[];
  onAlertTriggered: (id: string) => void;
}

interface ActiveAlert {
  id: string;
  todoId: string;
  company: string;
  type: string;
  dueTime: string;
}

export default function AlertSystem({ todos, onAlertTriggered }: AlertSystemProps) {
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().slice(0, 5); // HH:mm

      todos.forEach(todo => {
        if (
          !todo.completed && 
          !todo.alertTriggered && 
          todo.dueDate === todayStr && 
          todo.dueTime
        ) {
          // Trigger alert if time is reached or passed
          if (todo.dueTime <= currentTimeStr) {
            const alertId = crypto.randomUUID();
            setActiveAlerts(prev => [...prev, {
              id: alertId,
              todoId: todo.id,
              company: todo.company,
              type: todo.type,
              dueTime: todo.dueTime!
            }]);
            onAlertTriggered(todo.id);
            
            // Play a subtle sound if possible (optional, might be blocked)
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.5;
              audio.play();
            } catch (e) {
              console.log('Audio playback blocked');
            }
          }
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [todos, onAlertTriggered]);

  const removeAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[100] flex flex-col gap-3 w-[calc(100%-2rem)] md:w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {activeAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-white rounded-[24px] md:rounded-3xl shadow-2xl border border-black/5 p-4 md:p-5 pointer-events-auto flex gap-3 md:gap-4 items-start relative overflow-hidden"
          >
            {/* Progress Bar Background */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              onAnimationComplete={() => removeAlert(alert.id)}
              className="absolute bottom-0 left-0 h-1 bg-black/10"
            />

            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              alert.type === 'Interview' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {alert.type === 'Interview' ? <Clock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>

            <div className="flex-grow pr-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Task Alert</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Now Due</span>
              </div>
              <h4 className="font-bold text-gray-900 leading-tight mb-1">
                {alert.company} {alert.type}
              </h4>
              <p className="text-sm text-gray-500">
                Scheduled for <span className="font-semibold text-black">{alert.dueTime}</span>
              </p>
            </div>

            <button 
              onClick={() => removeAlert(alert.id)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
