import { Link } from "react-router-dom";
import { ProductGrid } from "../components/ProductGrid";
import { FilterBar } from "../components/FilterBar";
import { useLanguage } from "../context/LanguageContext";

export function Home() {
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            <section className="bg-card border rounded-xl p-8 md:p-12 shadow-sm">
                <div className="max-w-2xl space-y-4">
                    <h1 className="text-3xl font-bold tracking-tighter md:text-4xl text-foreground">
                        {t.hero.title}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {t.hero.subtitle}
                    </p>
                    <Link to="/?category=Clothes" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        {t.hero.shopNow}
                    </Link>
                </div>
            </section>

            <section>
                {/* <h2 className="text-2xl font-bold tracking-tight mb-6">Featured Collection</h2> */}
                <FilterBar />
                <ProductGrid />
            </section>
        </div>
    );
}
