import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function PropertyDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`https://dummyjson.com/products/${id}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Product not found");
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
    return () => controller.abort();
  }, [id]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Property detail</h1>
          <p className="text-sm text-gray-600">Dynamic route based on <code>id</code>.</p>
        </div>
        <Link
          to="/property"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to list
        </Link>
      </div>

      {loading && <p>Loading product details...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && product && (
        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          <img
            src={product.thumbnail}
            alt={product.title}
            className="h-80 w-full rounded-3xl object-cover"
          />
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">{product.category}</p>
            <h2 className="mt-3 text-3xl font-semibold">{product.title}</h2>
            <p className="mt-4 text-gray-700">{product.description}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium text-gray-700">
              <span className="rounded-full bg-gray-100 px-3 py-1">Brand: {product.brand}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1">Price: ${product.price}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1">Rating: {product.rating}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1">Stock: {product.stock}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
