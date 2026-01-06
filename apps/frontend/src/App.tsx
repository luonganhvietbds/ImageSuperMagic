import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/dashboard';
import GridToJson from './pages/module_grid_to_json';
import VisionToJson from './pages/module_vision_to_json';
import RealisticToJson from './pages/module_realistic_to_json';
import BatchManager from './pages/batch_manager';
import Jobs from './pages/jobs';
import Assets from './pages/assets';
import PromptBrain from './pages/prompt_brain';
import Settings from './pages/settings';

function App() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/grid-to-json" element={<GridToJson />} />
                <Route path="/vision-to-json" element={<VisionToJson />} />
                <Route path="/realistic-to-json" element={<RealisticToJson />} />
                <Route path="/batch-manager" element={<BatchManager />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/prompt-brain" element={<PromptBrain />} />
                <Route path="/settings" element={<Settings />} />
            </Route>
        </Routes>
    );
}

export default App;
