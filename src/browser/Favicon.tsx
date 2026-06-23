import {
  Circle,
  Book,
  Radio,
  Sparkles,
  Search,
  AlertTriangle,
  type LucideProps,
} from 'lucide-react';

const MAP = {
  circle: Circle,
  book: Book,
  radio: Radio,
  sparkles: Sparkles,
  search: Search,
  'triangle-alert': AlertTriangle,
} as const;

export default function Favicon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = MAP[name as keyof typeof MAP] ?? Circle;
  return <Icon {...props} />;
}
