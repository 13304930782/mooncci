import { Link } from 'react-router-dom';
import { Code2, Database, Network, Server, TerminalSquare } from 'lucide-react';
import type { HomeTopic } from '../../lib/homeContent';

const topicIcons = {
  code: Code2,
  terminal: TerminalSquare,
  network: Network,
  database: Database,
  server: Server,
};

function getTopicIcon(topic: HomeTopic) {
  return topicIcons[topic.icon as keyof typeof topicIcons] || Code2;
}

type TopicCardProps = {
  topic: HomeTopic;
};

export function TopicCard({ topic }: TopicCardProps) {
  const Icon = getTopicIcon(topic);

  return (
    <Link
      to={topic.to}
      className="home-topic-card relative block overflow-hidden rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm shadow-slate-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-800 dark:bg-slate-900/80 sm:p-5"
    >
      <div className="home-topic-icon mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-blue-700 shadow-sm shadow-blue-950/0 dark:bg-blue-950/50 dark:text-blue-300">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="home-topic-title text-base font-black tracking-[-0.02em] text-slate-950 dark:text-white">
        {topic.title}
      </h3>

      <p className="home-topic-description mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {topic.description}
      </p>

      <span className="home-topic-arrow absolute bottom-4 right-4 text-blue-600 dark:text-blue-300">→</span>
    </Link>
  );
}
