import type { Metadata } from 'next';
import './style.css';
export const metadata: Metadata = { title: 'floorX · Floor planner', description: 'Arrange fixtures and save your sales-floor layout.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
