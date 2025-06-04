import React, { useState } from "react";
import { branchedFeatureSelection } from "../lib/api";
import { toast } from "react-hot-toast";
import BranchedTreeView from "../components/BranchedTreeView";

export default function BranchedFeatureSelectionPage() {
  const [tree, setTree] = useState(null);
  const [featureNames, setFeatureNames] = useState([]);
  const [loading, setLoading] = useState(false);

  const [features, setFeatures] = useState([]);
  const [labels, setLabels] = useState([]);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await branchedFeatureSelection({ features, labels, feature_names: featureNames });
      if (res.data && res.data.tree) {
        setTree(res.data.tree);
        setFeatureNames(featureNames); 
        toast.success("Розгалужене дерево отримано!");
      } else {
        toast.error("Відповідь від сервера не містить дерева");
      }
    } catch (err) {
      toast.error("Помилка виконання аналізу: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-indigo-800 text-center">Розгалужений вибір ознак</h1>
      <div className="max-w-2xl mx-auto mb-6">
        <label className="block text-lg font-medium mb-2 text-indigo-700">Ознаки (features):</label>
        <textarea value={JSON.stringify(features)}
          onChange={e => setFeatures(JSON.parse(e.target.value || "[]"))}
          rows={2}
          className="w-full border p-2 rounded mb-2"
          placeholder="[[0.2, 0.7], [0.5, 0.4], ...]"
        />
        <label className="block text-lg font-medium mb-2 text-indigo-700">Мітки (labels):</label>
        <input value={labels.join(",")}
          onChange={e => setLabels(e.target.value.split(",").map(Number))}
          className="w-full border p-2 rounded mb-2"
          placeholder="0,1,1,0"
        />
        <label className="block text-lg font-medium mb-2 text-indigo-700">Імена ознак:</label>
        <input value={featureNames.join(",")}
          onChange={e => setFeatureNames(e.target.value.split(","))}
          className="w-full border p-2 rounded mb-2"
          placeholder="deep_1,deep_2,deep_3"
        />
      </div>
      <div className="text-center">
        <button
          className={`px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition mb-8 ${loading && "opacity-60 pointer-events-none"}`}
          onClick={handleRun}
        >
          {loading ? "Будується дерево..." : "Запустити розгалужений відбір"}
        </button>
      </div>
      <div className="max-w-5xl mx-auto mt-8">
        {tree ?
          <BranchedTreeView tree={tree} featureNames={featureNames} /> :
          <p className="text-gray-500 text-center text-lg">Дерево ще не згенеровано. Заповніть дані та натисніть кнопку!</p>
        }
      </div>
    </div>
  );
}
