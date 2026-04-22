import { AnimatePresence } from 'framer-motion';
import { useApp } from './context/AppContext';
import HomeScreen from './components/HomeScreen';
import TicketGrid from './components/TicketGrid';
import QuestionScreen from './components/QuestionScreen';
import ResultScreen from './components/ResultScreen';
import FlipCard from './components/FlipCard';

function AppContent() {
  const { screen } = useApp();

  return (
    <div className="phone-frame">
      <AnimatePresence mode="wait">
        {screen === 'home' && <HomeScreen key="home" />}
        {screen === 'tickets' && <TicketGrid key="tickets" />}
        {screen === 'question' && <QuestionScreen key="question" />}
        {screen === 'result' && <ResultScreen key="result" />}
        {screen === 'practice' && <FlipCard key="practice" />}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
