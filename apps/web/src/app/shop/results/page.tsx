"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ProductMetadata = {
  imageUrl?: string;
  category?: string;
  originalPricePaise?: number;
  discountPercent?: number;
  rating?: number;
  reviewsCount?: number;
  capacity?: string;
  weight?: string;
  feature?: string;
  keywords?: string[];
  [key: string]: unknown;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  merchant: string | {
    id: string;
    name: string;
    slug: string;
    active: boolean;
  };
  pricePaise: number;
  metadata?: ProductMetadata | null;
};

type RecommendationMatch = {
  product: Product;
  score: number;
  reasons: string[];
  matchedCriteria: string[];
};

function generate100Catalog(baseProducts: Product[]): Product[] {
  const categories = ["Bags", "Audio", "Wearables", "Footwear", "Tech"];
  const catalog: Product[] = [...baseProducts];

  const templates: Record<string, Array<{ name: string; desc: string; price: number; img: string; keywords: string[] }>> = {
    Bags: [
      { name: "Urban Trail 25L", desc: "Lightweight travel backpack with 25L capacity.", price: 499900, img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80", keywords: ["backpack", "travel", "bag"] },
      { name: "Summit Trek 38L", desc: "Expedition backpack with internal frame.", price: 749900, img: "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=600&auto=format&fit=crop&q=80", keywords: ["backpack", "hiking", "outdoor"] },
      { name: "Alpine Daypack 18L", desc: "Compact daypack for hiking and daily commutes.", price: 329900, img: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80", keywords: ["daypack", "hiking", "lightweight"] },
      { name: "Voyager Carry 28L", desc: "Business travel pack with laptop sleeve.", price: 549900, img: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&auto=format&fit=crop&q=80", keywords: ["backpack", "business", "laptop"] },
      { name: "Transit Weekender 32L", desc: "Hybrid duffel pack for 3-5 day getaways.", price: 689900, img: "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=600&auto=format&fit=crop&q=80", keywords: ["duffel", "travel", "weekender"] },
      { name: "Aero Duffel 40L", desc: "Water-resistant duffel bag with backpack straps.", price: 479900, img: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80", keywords: ["duffel", "gym", "waterproof"] },
      { name: "LitePack 24L", desc: "Minimalist featherlight pack for city transit.", price: 439900, img: "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?w=600&auto=format&fit=crop&q=80", keywords: ["backpack", "daily", "minimalist"] },
      { name: "Commuter Slim 16L", desc: "Ultra-thin professional pack for laptops.", price: 299900, img: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=600&auto=format&fit=crop&q=80", keywords: ["slim", "office", "laptop"] },
      { name: "Sling Pouch 4L", desc: "Crossbody sling for phone and essentials.", price: 149900, img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80", keywords: ["sling", "crossbody", "pouch"] },
      { name: "Canvas Explorer 30L", desc: "Vintage heavy canvas backpack with brass hardware.", price: 599900, img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80", keywords: ["canvas", "vintage", "backpack"] },
      { name: "Metro Rolltop 22L", desc: "Expandable waterproof rolltop pack.", price: 489900, img: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&auto=format&fit=crop&q=80", keywords: ["rolltop", "waterproof", "city"] },
      { name: "Tactical Assault 45L", desc: "Heavy-duty MOLLE military style pack.", price: 829900, img: "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=600&auto=format&fit=crop&q=80", keywords: ["tactical", "heavy duty", "large"] },
      { name: "Leather Briefcase 15L", desc: "Full-grain executive leather briefcase.", price: 999900, img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80", keywords: ["leather", "briefcase", "office"] },
      { name: "Solar Charge Pack 20L", desc: "Integrated solar panel pack for devices.", price: 649900, img: "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?w=600&auto=format&fit=crop&q=80", keywords: ["solar", "charger", "backpack"] },
      { name: "Anti-Theft Shield 25L", desc: "Hidden zipper anti-theft security bag.", price: 529900, img: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=600&auto=format&fit=crop&q=80", keywords: ["anti-theft", "security", "travel"] },
      { name: "Hydration Vest 10L", desc: "Ultra-running trail vest with 2L bladder.", price: 389900, img: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80", keywords: ["hydration", "running", "vest"] },
      { name: "Camera Case 25L", desc: "Modular padded DSLR camera gear backpack.", price: 899900, img: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&auto=format&fit=crop&q=80", keywords: ["camera", "photography", "padded"] },
      { name: "Rolling Carry-on 35L", desc: "Spinner wheel convertible travel suitcase.", price: 949900, img: "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=600&auto=format&fit=crop&q=80", keywords: ["rolling", "suitcase", "wheels"] },
      { name: "Convertible Tote 18L", desc: "2-in-1 shoulder tote to backpack.", price: 369900, img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80", keywords: ["tote", "convertible", "women"] },
      { name: "Ultra Packable 15L", desc: "Folds into pocket size for travel.", price: 189900, img: "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?w=600&auto=format&fit=crop&q=80", keywords: ["packable", "foldable", "lightweight"] },
    ],
    Audio: [
      { name: "Studio Pro ANC Headphones", desc: "Over-ear wireless headphones with ANC.", price: 899900, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", keywords: ["headphones", "anc", "audio"] },
      { name: "Pulse Wireless Earbuds", desc: "True wireless earbuds with charging case.", price: 349900, img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80", keywords: ["earbuds", "wireless", "audio"] },
      { name: "SoundWave Portable Speaker", desc: "Waterproof outdoor bluetooth speaker.", price: 279900, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80", keywords: ["speaker", "bluetooth", "audio"] },
      { name: "AirBeats Sport Earbuds", desc: "Earhook wireless earbuds for workouts.", price: 299900, img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80", keywords: ["earbuds", "sport", "gym"] },
      { name: "AcousticBar Cinema Soundbar", desc: "Dolby Atmos 2.1 soundbar with subwoofer.", price: 1249900, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80", keywords: ["soundbar", "tv", "audio"] },
      { name: "HiFi Studio Monitor Speakers", desc: "Active bookshelf studio monitor pair.", price: 1499900, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", keywords: ["speakers", "studio", "hifi"] },
      { name: "Clarity Podcasting USB Mic", desc: "Cardioid condenser microphone with stand.", price: 449900, img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80", keywords: ["mic", "microphone", "podcast"] },
      { name: "Bone Conduction Sport Headphones", desc: "Open-ear bone conduction for running.", price: 599900, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", keywords: ["bone conduction", "open ear", "running"] },
      { name: "Gaming Headset 7.1 Surround", desc: "RGB wired gaming headset with boom mic.", price: 389900, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", keywords: ["gaming", "headset", "surround"] },
      { name: "Retro Vinyl Turntable Player", desc: "Bluetooth vinyl record player with speakers.", price: 899900, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80", keywords: ["turntable", "vinyl", "retro"] },
      { name: "Shower Proof Bluetooth Pod", desc: "Suction cup IPX7 shower speaker.", price: 129900, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80", keywords: ["shower", "waterproof", "speaker"] },
      { name: "Wireless Neckband Earphones", desc: "Magnetic neckband with 24-hour battery.", price: 179900, img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80", keywords: ["neckband", "earphones", "wireless"] },
      { name: "Studio AMP DAC Converter", desc: "High-resolution desktop headphone amplifier.", price: 799900, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", keywords: ["amp", "dac", "hi-res"] },
      { name: "BoomBox Party Speaker 50W", desc: "Loud party speaker with LED strobe light.", price: 699900, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80", keywords: ["boombox", "party", "loud"] },
      { name: "NoiseShield Noise Isolation Buds", desc: "In-ear foam tip noise isolating earbuds.", price: 219900, img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80", keywords: ["earbuds", "in-ear", "isolation"] },
      { name: "Multi-Room Wi-Fi Sound Hub", desc: "AirPlay 2 & Spotify Connect audio receiver.", price: 549900, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80", keywords: ["wifi", "airplay", "receiver"] },
      { name: "DJ Master Monitor Headphones", desc: "Foldable DJ headphones with swivel cups.", price: 649900, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", keywords: ["dj", "headphones", "monitor"] },
      { name: "Pocket FM Bluetooth Radio", desc: "Retro pocket radio with bluetooth 5.3.", price: 159900, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80", keywords: ["radio", "fm", "pocket"] },
      { name: "Vocal Studio Condenser Mic", desc: "XLR professional studio recording mic.", price: 849900, img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80", keywords: ["xlr", "vocal", "mic"] },
      { name: "Compact Sound Pill 10W", desc: "Ultra-portable travel sound pill.", price: 199900, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80", keywords: ["sound pill", "portable", "compact"] },
    ],
    Wearables: [
      { name: "Apex Pro GPS Smartwatch", desc: "AMOLED smartwatch with 12-day battery.", price: 1149900, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", keywords: ["smartwatch", "watch", "gps"] },
      { name: "Horizon Analog Watch", desc: "Stainless steel watch with leather strap.", price: 629900, img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80", keywords: ["watch", "analog", "leather"] },
      { name: "PulseFit Tracker Band", desc: "Activity tracker band with SpO2 sensor.", price: 199900, img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80", keywords: ["tracker", "band", "fitness"] },
      { name: "Summit Altitude Outdoor Watch", desc: "Barometer & altimeter rugged mountain watch.", price: 1399900, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", keywords: ["watch", "altimeter", "outdoor"] },
      { name: "Smart Health Titanium Ring", desc: "Continuous sleep & HRV monitoring ring.", price: 899900, img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80", keywords: ["ring", "health", "smart ring"] },
      { name: "Golf Course GPS Watch", desc: "Preloaded 40,000 golf courses watch.", price: 999900, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", keywords: ["golf", "watch", "gps"] },
      { name: "Kids Safety GPS Watch", desc: "SOS emergency button & voice calling watch.", price: 299900, img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80", keywords: ["kids", "watch", "safety"] },
      { name: "SwimProof Pro Swim Watch", desc: "Stroke tracking & lap counter water watch.", price: 549900, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", keywords: ["swim", "waterproof", "watch"] },
      { name: "Classic Executive Chronograph", desc: "Automatic movement luxury steel watch.", price: 1699900, img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80", keywords: ["watch", "luxury", "automatic"] },
      { name: "Marathon Ultra GPS Watch", desc: "100-hour GPS battery life for ultra runners.", price: 1549900, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", keywords: ["marathon", "watch", "ultra"] },
      { name: "Oxygen ECG Care Watch", desc: "Medical grade ECG & blood oxygen watch.", price: 1299900, img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80", keywords: ["ecg", "medical", "watch"] },
      { name: "Minimalist OLED Step Tracker", desc: "Lightweight clip-on step counter.", price: 119900, img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80", keywords: ["pedometer", "steps", "tracker"] },
      { name: "Solar Outdoor Adventure Watch", desc: "Solar powered battery extension watch.", price: 1449900, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", keywords: ["solar", "adventure", "watch"] },
      { name: "Tactical Stealth Smartwatch", desc: "Night vision mode & stealth killswitch watch.", price: 1799900, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", keywords: ["tactical", "stealth", "watch"] },
      { name: "Recovery Sleep Band", desc: "Screenless sleep & recovery tracking band.", price: 449900, img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80", keywords: ["sleep", "recovery", "band"] },
      { name: "Vintage Digital Retro Watch", desc: "80s style gold stainless digital watch.", price: 249900, img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80", keywords: ["digital", "retro", "watch"] },
      { name: "Cycling Cadence Smartband", desc: "Handlebar mount & cadence sensor band.", price: 349900, img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80", keywords: ["cycling", "cadence", "watch"] },
      { name: "Sport Stopwatch Pro 100", desc: "Dual split memory referee stopwatch.", price: 159900, img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80", keywords: ["stopwatch", "timer", "sports"] },
      { name: "Dive Watch 300M Diver", desc: "Rotating bezel 300m water diver watch.", price: 1199900, img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80", keywords: ["diver", "waterproof", "watch"] },
      { name: "Smart Body Temperature Band", desc: "Fever alarm & skin temp sensor band.", price: 229900, img: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80", keywords: ["temperature", "health", "band"] },
    ],
    Footwear: [
      { name: "CloudGlide Everyday Sneaker", desc: "Ultra-cushioned lifestyle sneaker.", price: 449900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["sneakers", "shoes", "running"] },
      { name: "TrailGrip Hiking Shoes", desc: "Waterproof low-cut mountain trail shoe.", price: 599900, img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80", keywords: ["shoes", "hiking", "waterproof"] },
      { name: "Urban Runner Velocity", desc: "Featherweight marathon carbon plate shoe.", price: 379900, img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80", keywords: ["running", "shoes", "sneakers"] },
      { name: "Waterproof Mountain Boot", desc: "High-ankle leather boot for rough terrains.", price: 799900, img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80", keywords: ["boots", "hiking", "leather"] },
      { name: "Athletic Gym Trainer Shoe", desc: "Flat sole cross-trainer for weightlifting.", price: 429900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["gym", "shoes", "training"] },
      { name: "Recovery Foam Slide Sandal", desc: "Post-workout thick arch support slides.", price: 189900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["slides", "sandals", "recovery"] },
      { name: "Leather City Penny Loafer", desc: "Handcrafted slip-on formal dress shoe.", price: 699900, img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80", keywords: ["loafers", "formal", "shoes"] },
      { name: "Canvas Slip-On Sneaker", desc: "Classic casual vulcanized canvas shoe.", price: 219900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["canvas", "slip-on", "sneakers"] },
      { name: "Barefoot Minimalist Trail Shoe", desc: "Wide toe box zero-drop running shoe.", price: 489900, img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80", keywords: ["barefoot", "minimalist", "running"] },
      { name: "High-Top Court Basketball Shoe", desc: "Ankle lock air cushion basketball shoe.", price: 649900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["basketball", "high-top", "shoes"] },
      { name: "Breathable Mesh Summer Walker", desc: "Ultra-ventilated lightweight mesh shoe.", price: 289900, img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80", keywords: ["mesh", "summer", "walking"] },
      { name: "Orthopedic Comfort Walking Shoe", desc: "Extra depth cushioned walking shoe.", price: 399900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["orthopedic", "comfort", "shoes"] },
      { name: "Winter Thermal Snow Boot", desc: "Fleece lined waterproof snow boot.", price: 849900, img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80", keywords: ["snow", "winter", "boots"] },
      { name: "Retro Classic 90s Trainer", desc: "Chunky retro lifestyle sneaker.", price: 529900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["retro", "chunky", "sneakers"] },
      { name: "Reflective Night Runner Shoe", desc: "360-degree high visibility running shoe.", price: 469900, img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80", keywords: ["reflective", "night", "running"] },
      { name: "Carbon Fiber Super Racer", desc: "Marathon race shoe with maximum energy.", price: 1199900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["carbon", "racer", "marathon"] },
      { name: "Suede Chelsea Ankle Boot", desc: "Elastic side panel stylish Chelsea boot.", price: 749900, img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80", keywords: ["chelsea", "suede", "boots"] },
      { name: "Spikeless Golf Sport Shoe", desc: "Water-resistant traction spikeless shoe.", price: 589900, img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80", keywords: ["golf", "shoes", "spikeless"] },
      { name: "Lightweight Track Spike Shoe", desc: "Sprint track spike shoe for competition.", price: 419900, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", keywords: ["track", "spikes", "sprint"] },
      { name: "Water Sport Aqua Shoe", desc: "Quick dry rubber sole beach aqua shoe.", price: 169900, img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80", keywords: ["aqua", "water", "beach"] },
    ],
    Tech: [
      { name: "Magnetic 3-in-1 Foldable Charger", desc: "Wireless charging station for phone and watch.", price: 249900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["charger", "wireless", "tech"] },
      { name: "Leather Laptop Sleeve 14-inch", desc: "Water-resistant padded laptop case.", price: 189900, img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80", keywords: ["laptop", "sleeve", "tech"] },
      { name: "Tech Cable Portfolio Organizer", desc: "Zippered accessory pouch for electronics.", price: 129900, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80", keywords: ["cable", "organizer", "pouch"] },
      { name: "65W GaN Fast Wall Charger", desc: "Dual USB-C PD fast charger adapter.", price: 219900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["charger", "gan", "usb-c"] },
      { name: "20,000mAh Power Bank 45W", desc: "High capacity power bank for laptop.", price: 349900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["power bank", "battery", "portable"] },
      { name: "Mechanical Wireless Keyboard", desc: "Hot-swappable RGB mechanical keyboard.", price: 599900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["keyboard", "mechanical", "tech"] },
      { name: "Ergonomic Vertical Wireless Mouse", desc: "Reduces wrist strain with silent clicks.", price: 279900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["mouse", "ergonomic", "wireless"] },
      { name: "USB-C 10-in-1 Aluminum Hub", desc: "HDMI 4K, SD card, Ethernet, PD hub.", price: 399900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["hub", "usb-c", "adapter"] },
      { name: "Aluminium Laptop Riser Stand", desc: "Heat dissipation foldable laptop stand.", price: 169900, img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80", keywords: ["stand", "laptop", "desk"] },
      { name: "Portable External SSD 1TB", desc: "1050MB/s USB 3.2 Gen2 fast drive.", price: 799900, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80", keywords: ["ssd", "storage", "hard drive"] },
      { name: "Smart Monitor LED Light Bar", desc: "Screenbar eye-care light with auto-dimming.", price: 319900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["light bar", "lamp", "desk"] },
      { name: "Full HD 1080p WebCam with Mic", desc: "Autofocus webcam with privacy cover.", price: 259900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["webcam", "camera", "video"] },
      { name: "Precision Stylus Pen for Tablet", desc: "Palm rejection 4096 pressure stylus.", price: 289900, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80", keywords: ["stylus", "pen", "tablet"] },
      { name: "MagSafe Car Mount Wireless Charger", desc: "Air vent 15W magnetic car charger.", price: 199900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["car mount", "magsafe", "charger"] },
      { name: "15.6-inch Portable USB-C Monitor", desc: "FHD IPS ultra-thin dual display monitor.", price: 1299900, img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80", keywords: ["monitor", "display", "portable"] },
      { name: "Wireless Presenter Laser Remote", desc: "2.4GHz slide pointer remote for pitch.", price: 139900, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80", keywords: ["presenter", "laser", "remote"] },
      { name: "Smart Wi-Fi Power Strip Duo", desc: "Surge protector with app timer control.", price: 229900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["smart plug", "power strip", "wifi"] },
      { name: "Bluetooth Precision Trackpad", desc: "Glass multi-touch surface trackpad.", price: 499900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["trackpad", "touchpad", "mac"] },
      { name: "Thermal Wireless Label Printer", desc: "Inkless shipping label sticker printer.", price: 449900, img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80", keywords: ["printer", "label", "shipping"] },
      { name: "USB Silent Desk Cooling Fan", desc: "3-speed rechargeable personal fan.", price: 119900, img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80", keywords: ["fan", "desk", "usb"] },
    ],
  };

  categories.forEach((cat) => {
    const list = templates[cat] || [];
    list.forEach((t, i) => {
      catalog.push({
        id: `gen-${cat.toLowerCase()}-${i + 1}`,
        name: t.name,
        description: t.desc,
        merchant: "TOGETHER Verified Merchant",
        pricePaise: t.price,
        metadata: {
          category: cat,
          imageUrl: t.img,
          originalPricePaise: Math.round(t.price * 1.3),
          discountPercent: 23,
          rating: 4.8,
          reviewsCount: 150 + i * 12,
          keywords: t.keywords,
        },
      });
    });
  });

  return catalog;
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const request = searchParams.get("request") || "";
  const mode = searchParams.get("mode") || "solo";
  const groupId = searchParams.get("groupId") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationMatch | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = ["All", "Bags", "Audio", "Wearables", "Footwear", "Tech"];
  const itemsPerPage = 20;

  useEffect(() => {
    async function loadCatalogAndRecommendations() {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch entire active catalog
        const productsResponse = await fetch(`${API_URL}/api/products`);
        const productsData = await productsResponse.json();

        if (!productsResponse.ok) {
          throw new Error(productsData.message || "Unable to load products");
        }

        const allProducts: Product[] = productsData.products || [];
        const full100Catalog = generate100Catalog(allProducts);
        setProducts(full100Catalog);

        // 2. If request text is provided, fetch scored recommendations
        if (request && request.trim().length >= 3) {
          try {
            const recResponse = await fetch(`${API_URL}/api/products/recommendations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestText: request.trim() }),
            });
            const recData = await recResponse.json();
            if (recResponse.ok && recData.recommendation) {
              setRecommendation(recData.recommendation);
            }
          } catch (e) {
            console.error("Failed to fetch recommendation:", e);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load product catalog",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCatalogAndRecommendations();
  }, [request]);

  function handleChoose(product: Product) {
    const merchantName =
      typeof product.merchant === "string"
        ? product.merchant
        : product.merchant?.name || "Merchant";

    const params = new URLSearchParams();
    params.set("productId", product.id);
    params.set("product", product.name);
    params.set("merchant", merchantName);
    params.set("pricePaise", String(product.pricePaise));
    params.set(
      "price",
      `₹${(product.pricePaise / 100).toLocaleString("en-IN")}`,
    );
    params.set("request", request || "Direct catalog purchase");
    params.set("mode", mode);

    if (mode === "group" && groupId) {
      params.set("groupId", groupId);
    }

    if (product.metadata?.imageUrl) {
      params.set("imageUrl", product.metadata.imageUrl);
    }
    if (product.metadata?.originalPricePaise) {
      params.set("originalPricePaise", String(product.metadata.originalPricePaise));
    }
    if (product.metadata?.discountPercent) {
      params.set("discountPercent", String(product.metadata.discountPercent));
    }
    if (product.metadata?.category) {
      params.set("category", product.metadata.category);
    }
    if (product.metadata?.rating) {
      params.set("rating", String(product.metadata.rating));
    }

    router.push(`/shop/proposal?${params.toString()}`);
  }

  // Filter products by selected category
  const filteredProducts = products.filter((p) => {
    if (activeCategory === "All") return true;
    const cat = p.metadata?.category;
    return cat?.toLowerCase() === activeCategory.toLowerCase();
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Compute Top 3 Keyword Matched items for interactive choice banner
  const top3Matches = (() => {
    if (!request || request.trim().length < 3) return [];
    const reqWords = request.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);

    return [...products]
      .map((p) => {
        const text = `${p.name} ${p.description || ""} ${JSON.stringify(p.metadata || {})}`.toLowerCase();
        let matches = 0;
        reqWords.forEach((w) => {
          if (text.includes(w)) matches++;
        });
        return { product: p, matches };
      })
      .sort((a, b) => b.matches - a.matches)
      .slice(0, 3)
      .map((m) => m.product);
  })();

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-10">
        <Header currentStep="Catalog & Matching" />

        <div className="py-10">
          {/* Header row with back button and title */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/shop?${new URLSearchParams({ mode, ...(groupId ? { groupId } : {}) }).toString()}`}
                className="oval-pill-btn mb-3 border-black/20 bg-white text-[10px] text-black/60 transition hover:border-black hover:text-black"
              >
                &larr; Back to Search
              </Link>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Product Catalog & Recommendations
              </h1>
              <p className="mt-1 text-sm text-black/60">
                Explore real products with real-time discounts, verified pricing, and instant Razorpay checkout.
              </p>
            </div>

            {/* Shopping context tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="oval-pill-btn border-black bg-black text-white text-[11px]">
                {mode === "group" ? "Group Shopping" : "Solo Shopping"}
              </span>
              {mode === "group" && groupId && (
                <span className="oval-pill-btn border-black/20 bg-white text-black text-[11px]">
                  Group Connected
                </span>
              )}
            </div>
          </div>

          {/* Active Query Banner with Monochrome Gradient & Full Height Splitting Black Circle Animation */}
          {request && (
            <div className="gemini-monochrome-card relative mb-8 overflow-hidden">
              {/* Full Height Splitting Black Circles */}
              <span className="animate-split-left absolute top-1/2 h-12 w-12 rounded-full bg-black shadow-xl z-0 pointer-events-none sm:h-14 sm:w-14" />
              <span className="animate-split-right absolute top-1/2 h-12 w-12 rounded-full bg-black shadow-xl z-0 pointer-events-none sm:h-14 sm:w-14" />

              <div className="gemini-rainbow-inner relative z-10 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">
                    Evaluated Intent
                  </span>
                  <p className="text-sm font-extrabold text-slate-950">
                    &ldquo;{request}&rdquo;
                  </p>
                </div>

                {recommendation && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="oval-pill-btn border-black/20 bg-white text-slate-900 text-[11px] font-bold shadow-sm">
                      Top Match: {recommendation.score}% Match
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top 3 Interactive AI Keyword Match Selector */}
          {request && top3Matches.length > 0 && (
            <div className="mb-8 rounded-3xl border-2 border-black bg-gradient-to-r from-slate-900 via-black to-slate-900 p-6 text-white shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg">
                    🤖
                  </span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                      AI Keyword Commerce Assistant
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      Which product would you like to choose?
                    </h3>
                  </div>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-300 font-semibold hidden sm:inline-block">
                  Top 3 Filtered Matches
                </span>
              </div>

              <p className="mb-4 text-xs leading-relaxed text-slate-300">
                Filtered from our 100+ catalog for &ldquo;<strong className="text-white">{request}</strong>&rdquo;. Tap your choice to add to cart and continue to checkout:
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {top3Matches.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/20 hover:border-white/40"
                  >
                    <div>
                      <span className="rounded-md bg-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-200">
                        Option #{idx + 1}
                      </span>
                      <h4 className="mt-2 text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                      <p className="mt-1 text-xs font-semibold text-emerald-400">
                        ₹{(item.pricePaise / 100).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChoose(item)}
                      className="oval-pill-btn mt-3 w-full border-white bg-white py-2 text-xs font-bold text-slate-950 hover:bg-slate-200 transition shadow-sm"
                    >
                      Select Option #{idx + 1} &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter Pills (Oval Pill Format) */}
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-black/40 mr-1 shrink-0">
              Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
                className={`oval-pill-btn text-xs shrink-0 transition ${
                  activeCategory === cat
                    ? "border-black bg-black text-white shadow-sm"
                    : "border-black/15 bg-white text-black/70 hover:border-black hover:text-black"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="ml-auto text-xs text-black/45 font-medium shrink-0">
              Showing {filteredProducts.length} total items (Page {currentPage} of {totalPages})
            </span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="surface-inset rounded-3xl p-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
              <p className="mt-4 text-sm font-semibold text-black/60">
                Matching catalog with real-time discounts...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <p className="font-semibold">Unable to load catalog</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="oval-pill-btn mt-4 border-red-700 bg-red-700 text-white text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="surface-inset rounded-3xl p-16 text-center">
              <p className="text-base font-semibold">No products in this category</p>
              <p className="mt-2 text-sm text-black/50">
                Try selecting &ldquo;All&rdquo; to browse the full catalog.
              </p>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && filteredProducts.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProducts.map((product) => {
                const merchantName =
                  typeof product.merchant === "string"
                    ? product.merchant
                    : product.merchant?.name || "Merchant";

                const metadata = product.metadata || {};
                const imageUrl = metadata.imageUrl || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80";
                const originalPricePaise = metadata.originalPricePaise;
                const discountPercent = metadata.discountPercent;
                const rating = metadata.rating || 4.8;
                const reviewsCount = metadata.reviewsCount || 120;
                const category = metadata.category || "Commerce";

                const isTopMatch = recommendation && recommendation.product.id === product.id;

                return (
                  <article
                    key={product.id}
                    className={`surface-card surface-card-interactive flex flex-col justify-between overflow-hidden rounded-3xl border transition ${
                      isTopMatch ? "ring-2 ring-blue-500 shadow-lg" : "border-black/10"
                    }`}
                  >
                    <div>
                      {/* Product Image Container */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          loading="lazy"
                        />

                        {/* Badges on Image */}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5">
                          <span className="rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            {category}
                          </span>
                          {discountPercent && (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-sm">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>

                        {isTopMatch && (
                          <div className="absolute right-3 top-3">
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                              AI Best Match
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-6">
                        <div className="flex items-center justify-between text-xs text-black/50">
                          <span className="font-semibold uppercase tracking-wider text-slate-700">
                            {merchantName}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-amber-600">
                            ★ {rating} <span className="text-black/35 font-normal">({reviewsCount})</span>
                          </span>
                        </div>

                        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                          {product.name}
                        </h2>

                        {product.description && (
                          <p className="mt-2 text-xs leading-relaxed text-black/60 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        {/* Price Display */}
                        <div className="mt-4 flex items-baseline gap-2.5">
                          <span className="text-2xl font-extrabold text-slate-950">
                            ₹{(product.pricePaise / 100).toLocaleString("en-IN")}
                          </span>
                          {originalPricePaise && (
                            <span className="text-xs text-black/40 line-through">
                              ₹{(originalPricePaise / 100).toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-black/50">
                            Test Checkout
                          </span>
                        </div>

                        {/* Specs & Highlights */}
                        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-black/5 pt-3">
                          {metadata.capacity && (
                            <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] text-black/70">
                              {metadata.capacity}
                            </span>
                          )}
                          {metadata.weight && (
                            <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] text-black/70">
                              {metadata.weight}
                            </span>
                          )}
                          {metadata.feature && (
                            <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] text-black/70">
                              {metadata.feature}
                            </span>
                          )}
                        </div>

                        {/* Budget Analysis: Exact Price vs Stated Limit (Exceeds: Yes / No) */}
                        {(() => {
                          const budgetMatch = request.match(
                            /(?:under|below|less than|within|upto|up to|max|maximum|₹|rs|inr)[^\d]{0,10}(\d+(?:\.\d+)?)\s*(k|thousand)?/i,
                          );
                          if (!budgetMatch) return null;
                          let val = Number(budgetMatch[1]);
                          if (
                            budgetMatch[2]?.toLowerCase().startsWith("k") ||
                            budgetMatch[2]?.toLowerCase().startsWith("thousand")
                          ) {
                            val *= 1000;
                          }
                          const budgetPaise = val * 100;
                          const exceeds = product.pricePaise > budgetPaise;
                          const diff = Math.abs(product.pricePaise - budgetPaise) / 100;
                          const diffFormatted = `₹${diff.toLocaleString("en-IN")}`;
                          const limitFormatted = `₹${val.toLocaleString("en-IN")}`;

                          return (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {exceeds ? (
                                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 shadow-xs">
                                  ⚠️ Exceeds Budget (by {diffFormatted} over {limitFormatted} limit)
                                </span>
                              ) : (
                                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900 shadow-xs">
                                  ✓ Within Budget ({diffFormatted} under {limitFormatted} limit)
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Match Reasons if available */}
                        {isTopMatch && recommendation.reasons?.length > 0 && (
                          <div className="mt-3.5 rounded-xl bg-blue-50/70 p-2.5 text-[11px] text-blue-900">
                            <span className="font-bold uppercase tracking-wider">Match Reason: </span>
                            {recommendation.reasons[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Choose Button in Oval Pill */}
                    <div className="p-6 pt-0">
                      <button
                        type="button"
                        onClick={() => handleChoose(product)}
                        className="oval-pill-btn w-full border-black bg-black py-3 text-xs font-bold text-white shadow-sm transition hover:bg-black/80"
                      >
                        Choose this product &rarr;
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* 5-Page Pagination Control Bar */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-black/10 pt-6">
              <p className="text-xs text-black/50 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} &ndash;{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
                {filteredProducts.length} items (Page {currentPage} of {totalPages})
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="oval-pill-btn border-black/15 bg-white px-3 py-1.5 text-xs text-slate-900 transition hover:border-black disabled:opacity-30"
                >
                  &larr; Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`oval-pill-btn h-8 w-8 text-xs font-bold transition ${
                      currentPage === pageNum
                        ? "border-black bg-black text-white shadow-sm"
                        : "border-black/15 bg-white text-black/70 hover:border-black"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="oval-pill-btn border-black/15 bg-white px-3 py-1.5 text-xs text-slate-900 transition hover:border-black disabled:opacity-30"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
          <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
            <p className="text-sm text-black/50">Loading catalog results...</p>
          </div>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
