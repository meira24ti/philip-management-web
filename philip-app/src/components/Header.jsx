import PageHeader from "../components/PageHeader";

export default function Header({ menuOpen, onOpenMenu }) {
  return <PageHeader menuOpen={menuOpen} onOpenMenu={onOpenMenu} />;
}
