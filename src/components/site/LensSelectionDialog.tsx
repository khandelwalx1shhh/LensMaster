import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Upload, X, Camera, ShieldCheck, ArrowLeft, ChevronRight, Glasses, Eye, Layers, Circle, Palette, Droplet, Package } from "lucide-react";
import {
  getLensOptions,
  getProductCategory,
  requiresPrescription,
  isHighPowerRx,
  isBlueCutOfferProduct,
  BLUE_CUT_HIGH_POWER_SINGLE_PRICE,
  BLUE_CUT_HIGH_POWER_BUNDLE_PRICE,
  BLUE_CUT_HIGH_POWER_THRESHOLD,
  formatPrice,
  type ShopifyProduct,
  type ShopifyVariant,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: ShopifyProduct;
  variant: ShopifyVariant;
  editLineId?: string | null;
  initialAttributes?: Array<{ key: string; value: string }>;
}

type EyeKey = "sph" | "cyl" | "axis" | "add" | "bc" | "dia";
type EyeRx = Record<EyeKey, string>;
type PowerType = "powered" | "zero" | "progressive";
type ContactType = "clear" | "color" | "solutions" | "accessories";
type Step = 1 | 2 | 3;

const emptyEye: EyeRx = { sph: "", cyl: "", axis: "", add: "", bc: "", dia: "" };

const POWER_TYPES: {
  id: PowerType;
  title: string;
  badge?: string;
  desc: string;
  Icon: typeof Glasses;
}[] = [
  { id: "powered", title: "With Power", badge: "Most common", desc: "Positive, Negative or Cylindrical", Icon: Glasses },
  { id: "zero", title: "Zero Power", badge: "BLU Screen lenses", desc: "Blue light block for screen protection", Icon: Eye },
  { id: "progressive", title: "Progressive/Bifocals", desc: "Two powers in one eye", Icon: Layers },
];

const CONTACT_TYPES: {
  id: ContactType;
  title: string;
  badge?: string;
  desc: string;
  Icon: typeof Glasses;
}[] = [
  { id: "clear", title: "Clear", badge: "Most common", desc: "Everyday clear vision lenses as per your Rx", Icon: Circle },
  { id: "color", title: "Color", desc: "Cosmetic colored lenses — with or without power", Icon: Palette },
  { id: "solutions", title: "Solutions", desc: "Multi-purpose care & rinsing solutions", Icon: Droplet },
  { id: "accessories", title: "Accessories", desc: "Cases, tweezers and lens care kits", Icon: Package },
];

function parseEyeString(s: string | undefined): EyeRx {
  const eye: EyeRx = { ...emptyEye };
  if (!s) return eye;
  s.split("·").forEach((part) => {
    const m = part.trim().match(/^(SPH|CYL|AXIS|ADD|BC|DIA)\s+(.+)$/i);
    if (!m) return;
    const key = m[1].toLowerCase() as EyeKey;
    const val = m[2].trim();
    if (val && val !== "—") eye[key] = val;
  });
  return eye;
}

export function LensSelectionDialog({ open, onOpenChange, product, variant, editLineId, initialAttributes }: Props) {
  const category = getProductCategory(product.node);
  const lensCfg = useMemo(() => getLensOptions(category), [category]);
  const needsRx = requiresPrescription(category);
  const isEdit = !!editLineId;
  const isContacts = category === "contact-lens";
  const isOfferFrame = isBlueCutOfferProduct(product.node);
  const showProductType = !isContacts && (category === "prescription" || category === "blue-cut");
  const availablePowerTypes = useMemo(
    () => (isOfferFrame ? POWER_TYPES.filter((p) => p.id !== "progressive") : POWER_TYPES),
    [isOfferFrame]
  );

  const showContactType = isContacts;
  const [step, setStep] = useState<Step>(1);
  const [lensId, setLensId] = useState<string>(lensCfg?.defaultId ?? "");
  const [productType, setProductType] = useState<PowerType>("powered");
  const [contactType, setContactType] = useState<ContactType>("clear");
  const [rightEye, setRightEye] = useState<EyeRx>(emptyEye);
  const [leftEye, setLeftEye] = useState<EyeRx>(emptyEye);
  const [pd, setPd] = useState("");
  const [rxNotes, setRxNotes] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const updateLineAttributes = useCartStore((s) => s.updateLineAttributes);

  const contactNoRx = isContacts && (contactType === "solutions" || contactType === "accessories");
  // Wizard flow: whether step 1 (power type) and step 3 (add power) exist
  const hasPowerStep = showProductType || showContactType;
  const hasLensStep = !!lensCfg && !contactNoRx;
  const skipAddPower = productType === "zero" || contactNoRx;
  const hasAddPowerStep = needsRx && !skipAddPower;

  const steps: { n: Step; label: string; enabled: boolean }[] = [
    { n: 1, label: showContactType ? "Type" : "Power Type", enabled: hasPowerStep },
    { n: 2, label: "Lenses", enabled: hasLensStep },
    { n: 3, label: "Add Power", enabled: hasAddPowerStep },
  ].filter((s) => s.enabled) as { n: Step; label: string; enabled: boolean }[];

  const currentIndex = steps.findIndex((s) => s.n === step);
  const isLastStep = currentIndex === steps.length - 1;

  useEffect(() => {
    if (!open) return;
    const attrs = initialAttributes ?? [];
    const get = (k: string) => attrs.find((a) => a.key === k)?.value ?? "";
    const lensLabel = get("Lens");
    const matched = lensCfg?.options.find((o) => o.label === lensLabel);
    setLensId(matched?.id ?? lensCfg?.defaultId ?? "");
    setRightEye(parseEyeString(get("Rx Right (OD)")));
    setLeftEye(parseEyeString(get("Rx Left (OS)")));
    setPd(get("PD"));
    setRxNotes(get("Rx Notes"));
    const photo = get("Rx Photo");
    setPhotoName(photo || null);
    setPhotoPreview(null);
    const pt = get("Product Type").toLowerCase();
    setProductType(
      pt.includes("zero") ? "zero" : pt.includes("progressive") || pt.includes("bifocal") ? "progressive" : "powered"
    );
    const ct = get("Contact Type").toLowerCase();
    setContactType(
      ct.includes("color") ? "color" : ct.includes("solution") ? "solutions" : ct.includes("access") ? "accessories" : "clear"
    );
    // Start at first available step
    const first = (hasPowerStep ? 1 : hasLensStep ? 2 : 3) as Step;
    setStep(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lensCfg, initialAttributes]);

  const rxColumns: { key: EyeKey; label: string; placeholder: string }[] = isContacts
    ? [
        { key: "sph", label: "SPH", placeholder: "−2.25" },
        { key: "cyl", label: "CYL", placeholder: "−0.50" },
        { key: "axis", label: "AXIS", placeholder: "90" },
        { key: "bc", label: "BC", placeholder: "8.6" },
        { key: "dia", label: "DIA", placeholder: "14.2" },
      ]
    : [
        { key: "sph", label: "SPH", placeholder: "−1.25" },
        { key: "cyl", label: "CYL", placeholder: "−0.50" },
        { key: "axis", label: "AXIS", placeholder: "180" },
        { key: "add", label: "ADD", placeholder: "+1.00" },
      ];

  const formatEye = (e: EyeRx) => rxColumns.map((c) => `${c.label} ${e[c.key].trim() || "—"}`).join(" · ");
  const hasAnyRxField = () =>
    rxColumns.some((c) => rightEye[c.key].trim() || leftEye[c.key].trim()) || pd.trim().length > 0;

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(`${file.name} · ${(file.size / 1024).toFixed(0)} KB`);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoName(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const highPower = needsRx && isOfferFrame && isHighPowerRx([rightEye, leftEye]);
  const effectivePrice = highPower
    ? { amount: String(BLUE_CUT_HIGH_POWER_SINGLE_PRICE), currencyCode: variant.price.currencyCode }
    : variant.price;

  const goNext = () => {
    if (isLastStep) return handleConfirm();
    const next = steps[currentIndex + 1];
    if (next) setStep(next.n);
  };
  const goBack = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setStep(prev.n);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    const attributes: Array<{ key: string; value: string }> = [];
    if (showContactType) {
      const label = CONTACT_TYPES.find((c) => c.id === contactType)?.title ?? "Clear";
      attributes.push({ key: "Contact Type", value: label });
    }
    if (lensCfg && !contactNoRx) {
      const opt = lensCfg.options.find((o) => o.id === lensId);
      if (opt) attributes.push({ key: "Lens", value: opt.label });
    }
    if (needsRx && !contactNoRx) {
      if (showProductType) {
        const label =
          productType === "zero"
            ? "Zero Power (Screen Glass)"
            : productType === "progressive"
            ? "Progressive/Bifocals"
            : "With Power (Powered Eyeglass)";
        attributes.push({ key: "Product Type", value: label });
      }
      const collectRx = !skipAddPower;
      if (collectRx && hasAnyRxField()) {
        attributes.push({ key: "Rx Right (OD)", value: formatEye(rightEye) });
        attributes.push({ key: "Rx Left (OS)", value: formatEye(leftEye) });
        if (pd.trim()) attributes.push({ key: "PD", value: pd.trim() });
      }
      if (rxNotes.trim()) attributes.push({ key: "Rx Notes", value: rxNotes.trim() });
      if (photoName) attributes.push({ key: "Rx Photo", value: photoName });
      if (collectRx && highPower) {
        attributes.push({ key: "High Power", value: `Yes (above ±${BLUE_CUT_HIGH_POWER_THRESHOLD}.00)` });
      }
      attributes.push({
        key: "Rx Delivery",
        value: !collectRx
          ? "Zero power — no prescription needed"
          : photoName
          ? "Customer uploaded photo — our team will confirm on WhatsApp"
          : hasAnyRxField()
          ? "Customer entered prescription — our team will confirm on WhatsApp"
          : "Our team will contact on WhatsApp to collect prescription",
      });
    }
    if (isEdit && editLineId) {
      await updateLineAttributes(editLineId, attributes, effectivePrice);
    } else {
      await addItem({
        product,
        variantId: variant.id,
        variantTitle: variant.title,
        price: effectivePrice,
        quantity: 1,
        selectedOptions: variant.selectedOptions ?? [],
        attributes,
      });
    }
    setSubmitting(false);
    onOpenChange(false);
  };

  const nextLabel = isLastStep ? (isEdit ? "Save changes" : "Add to bag") : "Continue";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[92svh] overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-center gap-3">
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="p-1 -ml-1 rounded-full hover:bg-muted"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <span className="w-6" />
            )}
            <DialogTitle className="font-display text-[17px] font-medium tracking-tight flex-1">
              {isEdit ? "Edit prescription" : "Select Lens Type"}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">{product.node.title}</DialogDescription>

          {steps.length > 1 && (
            <div className="mt-4 grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))` }}>
              {steps.map((s, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                return (
                  <div key={s.n} className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-0 w-full justify-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-medium ${
                          active
                            ? "bg-foreground text-background"
                            : done
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] ${
                        active ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                    <div
                      className={`h-0.5 w-full rounded-full ${
                        active ? "bg-gold" : done ? "bg-foreground" : "bg-border"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* STEP 1: Power Type / Contact Type */}
          {step === 1 && hasPowerStep && showContactType && (
            <section>
              <h3 className="text-[15px] font-semibold mb-3">Choose category:</h3>
              <div className="space-y-2.5">
                {CONTACT_TYPES.map((o) => {
                  const active = contactType === o.id;
                  const Icon = o.Icon;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setContactType(o.id);
                        const noRx = o.id === "solutions" || o.id === "accessories";
                        setTimeout(() => {
                          if (noRx) {
                            // skip lens + Rx steps
                            handleConfirm();
                          } else if (lensCfg) {
                            setStep(2);
                          } else {
                            setStep(3);
                          }
                        }, 120);
                      }}
                      className={`w-full text-left rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition ${
                        active
                          ? "border-foreground bg-foreground/[0.03] shadow-sm"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <div className="h-11 w-11 rounded-xl bg-surface/70 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold">{o.title}</span>
                          {o.badge && (
                            <span className="text-[10px] italic text-muted-foreground bg-muted/60 rounded-md px-1.5 py-0.5">
                              {o.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{o.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {step === 1 && hasPowerStep && !showContactType && (
            <section>
              <h3 className="text-[15px] font-semibold mb-3">Select your Power Type:</h3>
              <div className="space-y-2.5">
                {availablePowerTypes.map((o) => {
                  const active = productType === o.id;
                  const Icon = o.Icon;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setProductType(o.id);
                        // auto-advance
                        setTimeout(() => {
                          if (o.id === "zero") {
                            // skip add power step
                            if (hasLensStep) setStep(2);
                            else handleConfirm();
                          } else {
                            if (hasLensStep) setStep(2);
                            else setStep(3);
                          }
                        }, 120);
                      }}
                      className={`w-full text-left rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition ${
                        active
                          ? "border-foreground bg-foreground/[0.03] shadow-sm"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <div className="h-11 w-11 rounded-xl bg-surface/70 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold">{o.title}</span>
                          {o.badge && (
                            <span className="text-[10px] italic text-muted-foreground bg-muted/60 rounded-md px-1.5 py-0.5">
                              {o.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{o.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 2: Lenses */}
          {step === 2 && hasLensStep && lensCfg && (
            <section>
              <h3 className="text-[15px] font-semibold mb-3">Choose your lens:</h3>
              <div className="space-y-2">
                {lensCfg.options.map((o) => {
                  const active = lensId === o.id;
                  const isDefault = o.id === lensCfg.defaultId;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setLensId(o.id)}
                      className={`w-full text-left rounded-xl border px-4 py-3 flex items-start gap-3 transition ${
                        active ? "border-foreground bg-foreground/[0.03]" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <span
                        className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          active ? "border-foreground bg-foreground" : "border-muted-foreground/40"
                        }`}
                      >
                        {active && <Check className="h-2.5 w-2.5 text-background" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[14px] font-medium">{o.label}</span>
                          {isDefault && (
                            <span className="text-[9px] uppercase tracking-wider bg-foreground text-background rounded-full px-1.5 py-0.5">
                              Default
                            </span>
                          )}
                        </span>
                        {o.note && <span className="block text-[12px] text-muted-foreground mt-0.5">{o.note}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 3: Add Power */}
          {step === 3 && hasAddPowerStep && (
            <section>
              <h3 className="text-[15px] font-semibold mb-3">Enter your prescription</h3>

              <div className="rounded-xl border border-border overflow-hidden">
                <div
                  className="grid bg-surface/60 text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
                  style={{ gridTemplateColumns: `72px repeat(${rxColumns.length}, minmax(0,1fr))` }}
                >
                  <div className="px-2.5 py-2">Eye</div>
                  {rxColumns.map((c) => (
                    <div key={c.key} className="px-2 py-2 text-center">
                      {c.label}
                    </div>
                  ))}
                </div>
                {(
                  [
                    { label: "Right (OD)", state: rightEye, set: setRightEye },
                    { label: "Left (OS)", state: leftEye, set: setLeftEye },
                  ] as const
                ).map((row) => (
                  <div
                    key={row.label}
                    className="grid border-t border-border items-center"
                    style={{ gridTemplateColumns: `72px repeat(${rxColumns.length}, minmax(0,1fr))` }}
                  >
                    <div className="px-2.5 py-2 text-[11px] font-medium text-foreground/80">{row.label}</div>
                    {rxColumns.map((c) => (
                      <input
                        key={c.key}
                        inputMode="decimal"
                        value={row.state[c.key]}
                        onChange={(e) => row.set({ ...row.state, [c.key]: e.target.value })}
                        placeholder={c.placeholder}
                        className="w-full text-center bg-transparent border-l border-border px-1.5 py-2 text-[12.5px] tabular-nums placeholder:text-muted-foreground/50 focus:outline-none focus:bg-foreground/[0.03]"
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                    PD (mm)
                  </label>
                  <input
                    inputMode="decimal"
                    value={pd}
                    onChange={(e) => setPd(e.target.value)}
                    placeholder="e.g. 62"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] tabular-nums placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/60"
                  />
                </div>
              </div>

              <label className="block text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-4 mb-1.5">
                Notes <span className="normal-case tracking-normal text-muted-foreground/60">(optional)</span>
              </label>
              <textarea
                value={rxNotes}
                onChange={(e) => setRxNotes(e.target.value)}
                rows={2}
                placeholder={isContacts ? "Brand preference, wear pattern…" : "Coatings, tint, anything else…"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/60 resize-none"
              />

              <label className="block text-[12px] text-muted-foreground mt-4 mb-1.5">
                Photo of prescription <span className="text-muted-foreground/60">(recommended)</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
              {!photoName ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-border hover:border-foreground/40 hover:bg-surface/50 transition px-4 py-5 flex flex-col items-center gap-2 text-center"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Camera className="h-4 w-4" strokeWidth={1.5} />
                    <Upload className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <span className="text-[13px] font-medium">Take a photo or upload</span>
                  <span className="text-[11px] text-muted-foreground">JPG or PNG · clear, well-lit</span>
                </button>
              ) : (
                <div className="rounded-xl border border-border p-3 flex items-center gap-3">
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Prescription preview"
                      className="h-14 w-14 rounded-md object-cover bg-surface"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">Prescription attached</p>
                    <p className="text-[11px] text-muted-foreground truncate">{photoName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="p-1.5 rounded-full hover:bg-muted"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>
                  No prescription handy? Skip it — our optician will WhatsApp you after checkout to collect the details.
                </span>
              </div>

              {highPower && (
                <div className="mt-3 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2.5 text-[12px] leading-relaxed">
                  <span className="font-medium text-foreground">
                    High power lens (above ±{BLUE_CUT_HIGH_POWER_THRESHOLD}.00):
                  </span>{" "}
                  <span className="text-muted-foreground">
                    priced at {formatPrice(BLUE_CUT_HIGH_POWER_SINGLE_PRICE, variant.price.currencyCode)} per piece ·{" "}
                    {formatPrice(BLUE_CUT_HIGH_POWER_BUNDLE_PRICE, variant.price.currencyCode)} for a pair.
                  </span>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="border-t px-5 py-4 bg-background flex items-center gap-3">
          {currentIndex > 0 && (
            <Button variant="outline" onClick={goBack} className="h-12 rounded-full px-5">
              Back
            </Button>
          )}
          <Button onClick={goNext} disabled={submitting} className="flex-1 h-12 rounded-full text-[14px] font-medium">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : nextLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
