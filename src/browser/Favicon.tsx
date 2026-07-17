import {
  Circle,
  Book,
  Sparkles,
  Search,
  AlertTriangle,
  Skull,
  Eye,
  type LucideProps,
} from 'lucide-react';
import catLogo from '../cat.png';

const MAP = {
  circle: Circle,
  book: Book,
  skull: Skull,
  eye: Eye,
  sparkles: Sparkles,
  search: Search,
  'triangle-alert': AlertTriangle,
  cat: CatMark,
} as const;

export default function Favicon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = MAP[name as keyof typeof MAP] ?? Circle;
  return <Icon {...props} />;
}

function CatMark({ className, size = 16 }: LucideProps) {
  return <img src={catLogo} alt="Omen cat logo" width={size} height={size} className={className} />;
}
