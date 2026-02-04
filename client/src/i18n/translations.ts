export type Language = 'GB' | 'SE' | 'FI';

export const translations = {
    GB: {
        nav: {
            accessories: "Accessories",
            sale: "Sale",
            clothes: "Clothes",
            shoes: "Shoes",
            signIn: "Sign In", // Even though we removed it, good to have
        },
        hero: {
            title: "Blooming new arrivals",
            subtitle: "Soft tones, comfy cuts, and everyday essentials.",
            shopNow: "Shop now",
        },
        filter: {
            searchPlaceholder: "Search products...",
            allCategories: "All categories",
            min: "Min",
            max: "Max",
            sort: {
                newest: "Newest",
                priceLowHigh: "Price: Low to High",
                priceHighLow: "Price: High to Low",
                nameAZ: "Name: A-Z",
            },
            onSale: "On sale",
            inStock: "In stock only",
            compactView: "Compact view",
            clearAll: "Clear all",
        },
        product: {
            comingSoon: "Image coming soon",
            view: "View",
            quickView: "Quick view",
            addToCart: "Add to Cart",
            outOfStock: "Out of Stock",
            backToShop: "Back to Shop",
            inStock: "In Stock",
            notFound: "Product not found",
        },
        cart: {
            title: "Shopping Cart",
            empty: "Your cart is empty.",
            total: "Total",
            checkout: "Checkout (Click & Collect)",
            continue: "Continue Shopping"
        },
        checkout: {
            title: "Checkout (Click & Collect)",
            back: "Back to Shop",
            form: {
                name: "Full Name",
                email: "Email Address (Optional)",
                phone: "Phone Number",
                placeOrder: "Place Order",
                processing: "Processing...",
            },
            summary: {
                title: "Order Summary",
                total: "Total to Pay",
                agreement: "By placing this order, you agree to pick up and pay for the items in our store within 48 hours."
            },
            success: {
                title: "Order Confirmed!",
                messagePart1: "Thank you for your order.",
                messagePart2: "We have sent a confirmation email to",
                messagePart3: "Please pay in-store when you collect your items.",
                continue: "Continue Shopping"
            }
        }
    },
    SE: {
        nav: {
            accessories: "Accessoarer",
            sale: "Rea",
            clothes: "Kläder",
            shoes: "Skor",
            signIn: "Logga in",
        },
        hero: {
            title: "Blommande nyheter",
            subtitle: "Mjuka toner, bekväma snitt och vardagliga favoriter.",
            shopNow: "Handla nu",
        },
        filter: {
            searchPlaceholder: "Sök produkter...",
            allCategories: "Alla kategorier",
            min: "Min",
            max: "Max",
            sort: {
                newest: "Nyast",
                priceLowHigh: "Pris: Lågt till Högt",
                priceHighLow: "Pris: Högt till Lågt",
                nameAZ: "Namn: A-Ö",
            },
            onSale: "På rea",
            inStock: "Endast i lager",
            compactView: "Kompakt vy",
            clearAll: "Rensa alla",
        },
        product: {
            comingSoon: "Bild kommer snart",
            view: "Visa",
            quickView: "Snabbvy",
            addToCart: "Lägg i varukorg",
            outOfStock: "Slutsåld",
            backToShop: "Tillbaka till butiken",
            inStock: "I lager",
            notFound: "Produkten hittades inte",
        },
        cart: {
            title: "Varukorg",
            empty: "Din varukorg är tom.",
            total: "Totalt",
            checkout: "Kassan (Hämta i butik)",
            continue: "Fortsätt handla"
        },
        checkout: {
            title: "Kassan (Hämta i butik)",
            back: "Tillbaka till butiken",
            form: {
                name: "Fullständigt namn",
                email: "E-postadress (Valfritt)",
                phone: "Telefonnummer",
                placeOrder: "Lägg beställning",
                processing: "Bearbetar...",
            },
            summary: {
                title: "Beställningsöversikt",
                total: "Att betala",
                agreement: "Genom att lägga denna beställning godkänner du att hämta och betala för varorna i vår butik inom 48 timmar."
            },
            success: {
                title: "Order bekräftad!",
                messagePart1: "Tack för din beställning.",
                messagePart2: "Vi har skickat ett bekräftelsemail till",
                messagePart3: "Vänligen betala i butiken när du hämtar dina varor.",
                continue: "Fortsätt handla"
            }
        }
    },
    FI: {
        nav: {
            accessories: "Asusteet",
            sale: "Ale",
            clothes: "Vaatteet",
            shoes: "Kengät",
            signIn: "Kirjaudu",
        },
        hero: {
            title: "Kukkivat uutuudet",
            subtitle: "Pehmeitä sävyjä, mukavia leikkauksia ja arjen suosikkeja.",
            shopNow: "Osta nyt",
        },
        filter: {
            searchPlaceholder: "Etsi tuotteita...",
            allCategories: "Kaikki kategoriat",
            min: "Min",
            max: "Max",
            sort: {
                newest: "Uusimmat",
                priceLowHigh: "Hinta: Pienin ensin",
                priceHighLow: "Hinta: Suurin ensin",
                nameAZ: "Nimi: A-Ö",
            },
            onSale: "Alennuksessa",
            inStock: "Vain varastossa",
            compactView: "Tiivis näkymä",
            clearAll: "Tyhjennä kaikki",
        },
        product: {
            comingSoon: "Kuva tulossa pian",
            view: "Näytä",
            quickView: "Pikakatselu",
            addToCart: "Lisää ostoskoriin",
            outOfStock: "Loppu varastosta",
            backToShop: "Takaisin kauppaan",
            inStock: "Varastossa",
            notFound: "Tuotetta ei löytynyt",
        },
        cart: {
            title: "Ostoskori",
            empty: "Ostoskorisi on tyhjä.",
            total: "Yhteensä",
            checkout: "Kassa (Nouto myymälästä)",
            continue: "Jatka ostoksia"
        },
        checkout: {
            title: "Kassa (Nouto myymälästä)",
            back: "Takaisin kauppaan",
            form: {
                name: "Koko nimi",
                email: "Sähköpostiosoite (Valinnainen)",
                phone: "Puhelinnumero",
                placeOrder: "Tilaa",
                processing: "Käsitellään...",
            },
            summary: {
                title: "Tilauksen yhteenveto",
                total: "Maksettavaa",
                agreement: "Tekemällä tämän tilauksen sitoudut noutamaan ja maksamaan tuotteet myymälässämme 48 tunnin kuluessa."
            },
            success: {
                title: "Tilaus vahvistettu!",
                messagePart1: "Kiitos tilauksestasi.",
                messagePart2: "Olemme lähettäneet tilausvahvistuksen osoitteeseen",
                messagePart3: "Ole hyvä ja maksa myymälässä noutaessasi tuotteet.",
                continue: "Jatka ostoksia"
            }
        }
    }
};
