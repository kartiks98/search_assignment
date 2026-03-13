import { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ShoppingCart,
} from "lucide-react";
import debounce from "lodash.debounce";

interface Product {
  id: string;
  name: string;
  price: number;
  msrp?: number;
  thumbnailImageUrl: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
}

const SITE_ID = "scmq7n";
const API_BASE_URL = "https://api.searchspring.net/api/search/search.json";

const App = () => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cartItemsMap, setCartItemsMap] = useState<Record<string, number>>({});

  const totalCartItems = useMemo(() => {
    return Object.values(cartItemsMap).reduce(
      (totalItemsCount, cartItemCount) => totalItemsCount + cartItemCount,
      0,
    );
  }, [cartItemsMap]);

  const fetchProducts = useCallback(
    async (searchQuery: string, page: number = 1) => {
      setLoading(true);
      try {
        const response = await axios.get(API_BASE_URL, {
          params: {
            siteId: SITE_ID,
            q: searchQuery,
            resultsFormat: "native",
            page,
          },
        });

        const { results, pagination } = response.data;

        setProducts(results || []);
        setPagination(pagination || null);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const debouncedFetch = useCallback(
    debounce((q: string, page: number) => fetchProducts(q, page), 500),
    [fetchProducts],
  );

  useEffect(() => {
    fetchProducts("", 1);

    return () => {
      debouncedFetch.cancel();
    };
  }, [fetchProducts, debouncedFetch]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedFetch(value, 1);
  };

  const handleSearch = () => {
    debouncedFetch.cancel();
    fetchProducts(query, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchProducts(query, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = (productId: string, isSubtract?: boolean) => {
    setCartItemsMap((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + (isSubtract ? -1 : 1),
    }));
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages === 1) return null;

    const { currentPage, totalPages } = pagination;
    const pages = [];

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <div className="d-flex align-items-center justify-content-center my-4">
        <button
          className="btn btn-outline-primary me-2"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <ChevronLeft size={18} /> Previous
        </button>

        {currentPage > 3 && <span className="me-2">...</span>}

        {pages.map((p) => (
          <button
            key={p}
            className={`btn  btn-outline-primary me-2 ${p === currentPage ? "active" : ""}`}
            onClick={() => handlePageChange(p)}
          >
            {p}
          </button>
        ))}

        {currentPage < totalPages - 2 && <span className="me-2">...</span>}

        <button
          className="btn btn-outline-primary me-2"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white shadow-sm sticky-top container py-3">
        <div className="container py-3">
          <div className="row">
            <div className="col-md-auto">
              <h4
                className="text-primary fw-bold"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setQuery("");
                  fetchProducts("", 1);
                }}
              >
                SearchSpring
              </h4>
            </div>
            <div className="col-md">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={20} />
                </span>
                <input
                  type="text"
                  className="form-control shadow-none"
                  placeholder="Search"
                  id="search"
                  value={query}
                  onChange={handleSearchInput}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button className="btn btn-primary px-4" onClick={handleSearch}>
                  Search
                </button>
                <button className="btn btn-outline-primary ms-2">
                  <ShoppingCart size={20} />
                  {!!totalCartItems && (
                    <span className="ms-2">{totalCartItems}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {products.length > 0 && renderPagination()}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5 my-5">
            <div className="spinner-border text-primary" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
              {products.map((product) => {
                const price = +product.price;
                const msrp = product?.msrp ? +product.msrp : null;
                return (
                  <div key={product.id} className="col">
                    <div className="card shadow border-0">
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{ height: "200px" }}
                      >
                        <img
                          src={product.thumbnailImageUrl}
                          alt={product.name}
                          className="h-100"
                        />
                      </div>
                      <div className="card-body d-flex flex-column">
                        <h6
                          style={{
                            minHeight: "3rem",
                          }}
                        >
                          {product.name}
                        </h6>
                        <div>
                          <span className="h5 fw-bold text-primary">
                            ${price.toFixed(2)}
                          </span>
                          {msrp && msrp > price && (
                            <span className="text-muted text-decoration-line-through ms-2">
                              ${msrp.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          {!cartItemsMap[product.id] ? (
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleAddToCart(product.id)}
                            >
                              Add to Cart
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() =>
                                  handleAddToCart(product.id, true)
                                }
                              >
                                <Minus size={15} />
                              </button>
                              <span className="mx-2">
                                {cartItemsMap[product.id]}
                              </span>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleAddToCart(product.id)}
                              >
                                <Plus size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="text-center py-5 shadow rounded">
            <Search size={48} className="opacity-25" />
            <h5>No product found</h5>
          </div>
        )}
      </div>
    </>
  );
};

export default App;
