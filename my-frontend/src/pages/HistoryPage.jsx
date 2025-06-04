// HistoryPage.js
import { useEffect, useState } from "react";
import { getHistory, getHistoryById, deleteHistoryItem } from "../lib/api";
import toast from "react-hot-toast";
import BranchedTreeD3 from "../components/BranchedTreeView"; // шляхи підлаштуй під себе

function toD3Tree(node, parentAcc = null) {
  // Перетворення у формат для d3-tree
  if (!node) return {};
  const label = node.feature
    ? `${node.feature} (${(node.accuracy * 100).toFixed(1)}%)`
    : `Початок (${(node.accuracy * 100).toFixed(1)}%)`;
  let diff =
    parentAcc !== null ? ` +${((node.accuracy - parentAcc) * 100).toFixed(1)}%` : "";
  let name = `${label}${diff}`;
  const children = node.children
    ? node.children.map((child) => toD3Tree(child, node.accuracy))
    : [];
  return {
    name,
    attributes: {
      Ознака: node.feature || "—",
      Точність: `${(node.accuracy * 100).toFixed(2)}%`
    },
    children
  };
}

function HistoryModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-3xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl"
          title="Закрити"
        >
          &times;
        </button>
        <h3 className="text-xl font-semibold mb-3">Деталі аналізу</h3>
        <div className="mb-2 text-gray-700">
          <div>
            <b>Дата:</b> {new Date(item.date).toLocaleString()}
          </div>
          <div>
            <b>Класи:</b> {item.classNames.join(", ")}
          </div>
          <div>
            <b>Ознаки:</b> {item.featureNames?.join(", ") || "—"}
          </div>
        </div>
        <div className="mt-3">
          <b>Дерево вибору:</b>
          <div className="mt-2 border rounded-xl bg-gray-50">
            <BranchedTreeD3 data={toD3Tree(item.selectionTree)} />
          </div>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-blue-500">
            Показати сирий JSON
          </summary>
          <pre className="bg-gray-100 rounded p-2 text-xs mt-1 overflow-x-auto max-h-48">
            {JSON.stringify(item.selectionTree, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getHistory()
      .then((res) => setHistory(res.data))
      .catch(() => toast.error("Помилка завантаження історії"))
      .finally(() => setLoading(false));
  }, []);

  // Деталі (витягуємо при кліку)
  const handleDetails = async (id) => {
    setSelected(id);
    try {
      const r = await getHistoryById(id);
      setModalData(r.data);
    } catch {
      toast.error("Не вдалося отримати деталі");
    }
  };

  // Видалення з підтвердженням
  const handleDelete = (id) => {
    if (window.confirm("Видалити цей запис з історії?")) {
      setDeletingId(id);
      deleteHistoryItem(id)
        .then(() => {
          setHistory((h) => h.filter((x) => x._id !== id));
          toast.success("Запис видалено");
        })
        .catch(() => toast.error("Не вдалося видалити"))
        .finally(() => setDeletingId(null));
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-2">
      <h2 className="text-2xl font-bold mb-5 text-center">
        Моя історія аналізів
      </h2>
      {loading ? (
        <div className="text-center py-10 text-gray-500">Завантаження...</div>
      ) : history.length === 0 ? (
        <div className="text-center text-gray-500">Історія порожня.</div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item._id}
              className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center justify-between border hover:border-indigo-300 transition"
            >
              <div className="flex-1">
                <div className="text-gray-500 text-xs mb-1">
                  {new Date(item.date).toLocaleString()}
                </div>
                <div className="font-semibold text-gray-800 mb-1">
                  Класи: {item.classNames.join(", ")}
                </div>
                <div className="text-xs text-gray-600">
                  Ознак: {item.featureNames?.length || "—"}
                </div>
              </div>
              <div className="flex gap-2 mt-3 md:mt-0">
                <button
                  className="px-4 py-1 bg-indigo-100 hover:bg-indigo-200 rounded text-indigo-700 text-sm"
                  onClick={() => handleDetails(item._id)}
                >
                  Деталі
                </button>
                <button
                  className={`px-4 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 text-sm ${
                    deletingId === item._id ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={() => handleDelete(item._id)}
                  disabled={deletingId === item._id}
                >
                  {deletingId === item._id ? "Видалення..." : "Видалити"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка для деталей */}
      {selected && modalData && (
        <HistoryModal item={modalData} onClose={() => { setSelected(null); setModalData(null); }} />
      )}
    </div>
  );
}
