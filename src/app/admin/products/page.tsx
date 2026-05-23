'use client';

import { useState, useEffect } from 'react';
import { useProducts, type Product } from '@/lib/products-context';

const LOCALES = ['en', 'zh', 'es', 'ja', 'ko', 'de', 'fi'] as const;
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', zh: '中文', es: 'Español', ja: '日本語', ko: '한국어', de: 'Deutsch', fi: 'Suomi',
};
const CATEGORIES = ['plant', 'energy'] as const;
const CATEGORY_NAMES: Record<string, string> = { plant: 'Plant Grow Lights', energy: 'Energy Saving' };

type FormData = {
  slug: string;
  category: 'plant' | 'energy';
  image: string;
  images: string[];
  name: Record<string, string>;
  description: Record<string, string>;
  specs: Record<string, Record<string, string>>;
  features: Record<string, string[]>;
};

const emptyForm = (): FormData => ({
  slug: '',
  category: 'plant',
  image: '',
  images: [],
  name: Object.fromEntries(LOCALES.map((l) => [l, ''])),
  description: Object.fromEntries(LOCALES.map((l) => [l, ''])),
  specs: Object.fromEntries(LOCALES.map((l) => [l, {}])),
  features: Object.fromEntries(LOCALES.map((l) => [l, []])),
});

export default function AdminProductsPage() {
  const { products, loading, refetch } = useProducts();
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [specLocale, setSpecLocale] = useState<string>('en');
  const [featureLocale, setFeatureLocale] = useState<string>('en');
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    setMessage('');
  }, [showForm, editing]);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function startEdit(product: Product) {
    setEditing(product);
    setForm({
      slug: product.slug,
      category: product.category,
      image: product.image,
      images: product.images,
      name: { ...product.name },
      description: { ...product.description },
      specs: { ...product.specs },
      features: { ...product.features },
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = editing ? { id: editing.id, ...form } : form;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      setShowForm(false);
      setMessage(editing ? 'Product updated' : 'Product created');
      refetch();
    } catch {
      setMessage('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setMessage('Product deleted');
      refetch();
    } catch {
      setMessage('Delete failed');
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({
        ...f,
        image: data.url,
        images: [data.url, ...f.images],
      }));
    } catch {
      setMessage('Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  function updateSpec(key: string, value: string) {
    setForm((f) => ({
      ...f,
      specs: {
        ...f.specs,
        [specLocale]: { ...f.specs[specLocale], [key]: value },
      },
    }));
  }

  function removeSpec(key: string) {
    const updated = { ...form.specs[specLocale] };
    delete updated[key];
    setForm((f) => ({
      ...f,
      specs: { ...f.specs, [specLocale]: updated },
    }));
  }

  function addFeature() {
    if (!featureInput.trim()) return;
    setForm((f) => ({
      ...f,
      features: {
        ...f.features,
        [featureLocale]: [...(f.features[featureLocale] || []), featureInput.trim()],
      },
    }));
    setFeatureInput('');
  }

  function removeFeature(index: number) {
    setForm((f) => ({
      ...f,
      features: {
        ...f.features,
        [featureLocale]: f.features[featureLocale].filter((_, i) => i !== index),
      },
    }));
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <button
          onClick={startCreate}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          + Add Product
        </button>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No products yet</p>
          <p className="text-sm mt-1">Click "Add Product" to create your first product</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name (EN)</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100 text-sm">
                  <td className="px-4 py-3">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{p.name.en || p.slug}</td>
                  <td className="px-4 py-3 text-gray-500">{p.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.category === 'plant'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {CATEGORY_NAMES[p.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-purple-600 hover:text-purple-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit/Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 p-6 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              &times;
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editing ? 'Edit Product' : 'New Product'}
            </h2>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="product-slug"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as 'plant' | 'energy' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_NAMES[c]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center gap-4">
                  {form.image && (
                    <img src={form.image} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                  )}
                  <label className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Multi-locale Name & Description */}
              {LOCALES.map((locale) => (
                <div key={locale} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-purple-600">{LOCALE_NAMES[locale]}</h3>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      value={form.name[locale] || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: { ...f.name, [locale]: e.target.value } }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <textarea
                      value={form.description[locale] || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: { ...f.description, [locale]: e.target.value } }))
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                  </div>
                </div>
              ))}

              {/* Specs */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Specifications</h3>
                  <select
                    value={specLocale}
                    onChange={(e) => setSpecLocale(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {LOCALES.map((l) => (
                      <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
                    ))}
                  </select>
                </div>
                {Object.entries(form.specs[specLocale] || {}).map(([key, value]) => (
                  <div key={key} className="flex gap-2 mb-2">
                    <input
                      value={key}
                      onChange={(e) => {
                        const oldKey = key;
                        const newKey = e.target.value;
                        const updated = { ...form.specs[specLocale] };
                        updated[newKey] = updated[oldKey];
                        if (oldKey !== newKey) delete updated[oldKey];
                        setForm((f) => ({
                          ...f,
                          specs: { ...f.specs, [specLocale]: updated },
                        }));
                      }}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="Key"
                    />
                    <input
                      value={value}
                      onChange={(e) => updateSpec(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => removeSpec(key)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateSpec('', '')}
                  className="text-xs text-purple-600 hover:text-purple-800"
                >
                  + Add Spec
                </button>
              </div>

              {/* Features */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Features</h3>
                  <select
                    value={featureLocale}
                    onChange={(e) => setFeatureLocale(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {LOCALES.map((l) => (
                      <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
                    ))}
                  </select>
                </div>
                <ul className="space-y-1 mb-2">
                  {(form.features[featureLocale] || []).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      {f}
                      <button
                        onClick={() => removeFeature(i)}
                        className="ml-auto text-red-400 hover:text-red-600 text-xs"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="Add feature..."
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <button
                    onClick={addFeature}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.slug}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
