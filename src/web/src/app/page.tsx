import { CampaignProvider } from './context/CampaignContext';
import ChatPanel from './components/ChatPanel';
import TimelinePanel from './components/TimelinePanel';

export default function Home() {
  return (
    <CampaignProvider>
      <main className="flex flex-col md:flex-row h-[calc(100vh-49px)]">
        <ChatPanel className="w-full h-1/2 md:h-full md:w-3/5 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700" />
        <TimelinePanel className="w-full h-1/2 md:h-full md:w-2/5" />
      </main>
    </CampaignProvider>
  );
}
