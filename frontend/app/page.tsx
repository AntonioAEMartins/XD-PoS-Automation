import { ArchitectureSection } from "@/components/landing/architecture-section";
import { DemoSection } from "@/components/landing/demo-section";
import { DiscoverySection } from "@/components/landing/discovery-section";
import { LiquidGlassSelector } from "@/components/liquid-glass-selector";

const SECTIONS = [
  { id: "discovery", label: "Discovery", number: "01" },
  { id: "architecture", label: "Architecture", number: "02" },
  { id: "demo", label: "Demo", number: "03" }
];

export default function LandingPage() {
  return (
    <>
      <LiquidGlassSelector sections={SECTIONS} />
      <main className="flex w-full flex-col">
        <DiscoverySection />
        <ArchitectureSection />
        <DemoSection />
      </main>
    </>
  );
}
