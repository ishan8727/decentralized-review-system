import Image from "next/image";
import Appbar from "./Components/Appbar";
import UpoadImage from "./Components/UpoadImage";
import { Hero } from "./Components/Hero";

export default function Home() {
  return (
    <main className="bg-black max-h-screen w-full overflow-hidden scroll-p-0 select-none">
      <Appbar />
      <Hero/>
      <UpoadImage />
    </main>
  );
}
