import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Zap, Wrench, Hammer, Sparkles, HeartPulse, PaintBucket } from 'lucide-react';

export const CATEGORIES = [
  { id: 'Electrician', nameKey: 'catElectrician', icon: Zap, color: '#028090', desc: 'Wiring, MCB, fans, lighting' },
  { id: 'Plumber', nameKey: 'catPlumber', icon: Wrench, color: '#00A896', desc: 'Pipes, leaks, taps, drainage' },
  { id: 'Carpenter', nameKey: 'catCarpenter', icon: Hammer, color: '#16325C', desc: 'Furniture, doors, locks, repairs' },
  { id: 'Domestic Help', nameKey: 'catDomesticHelp', icon: Sparkles, color: '#02C39A', desc: 'Housekeeping, cleaning, cooking' },
  { id: 'Caregiver', nameKey: 'catCaregiver', icon: HeartPulse, color: '#C0392B', desc: 'Elderly care, nursing, attendants' },
  { id: 'Painter', nameKey: 'catPainter', icon: PaintBucket, color: '#028090', desc: 'Wall painting, waterproofing' }
];

export default function ServiceCategoryGrid({ selectedCategory, onSelectCategory }) {
  const { t } = useLanguage();

  return (
    <div className="grid-3" style={{ margin: '16px 0' }}>
      {CATEGORIES.map((cat) => {
        const IconComponent = cat.icon;
        const isSelected = selectedCategory === cat.id;

        return (
          <div
            key={cat.id}
            className={`category-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectCategory && onSelectCategory(cat.id)}
            role="button"
            tabIndex={0}
          >
            <div className="category-icon-wrap" style={{ color: cat.color }}>
              <IconComponent size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>
                {t(cat.nameKey)}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                {cat.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
