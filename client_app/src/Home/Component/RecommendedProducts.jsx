import React, { useEffect, useState } from 'react';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
import Product from '../../API/Product';

const currencyFormatter = new Intl.NumberFormat('vi-VN');

function RecommendedProducts({ productId }) {
    const [products, setProducts] = useState([]);
    const userId = sessionStorage.getItem('id_user') || '';

    useEffect(() => {
        let active = true;
        const params = {
            limit: 8,
            userId: userId || undefined,
            productId: productId || undefined,
        };

        Product.Get_Recommendations(queryString.stringify(params))
            .then(response => {
                if (active && Array.isArray(response)) setProducts(response);
            })
            .catch(() => {
                if (active) setProducts([]);
            });

        return () => { active = false; };
    }, [productId, userId]);

    if (!products.length) return null;

    return (
        <section className="product-area pt-35 pb-45">
            <div className="container">
                <div className="li-section-title">
                    <h2><span>Gợi ý cho bạn</span></h2>
                </div>
                <div className="row">
                    {products.map(product => (
                        <div className="col-lg-3 col-md-4 col-sm-6 mt-25 col_product" key={product._id}>
                            <div className="single-product-wrap">
                                <div className="product-image">
                                    <Link to={`/detail/${product._id}`}>
                                        <img src={product.image} alt={product.name_product} />
                                    </Link>
                                </div>
                                <div className="product_desc">
                                    <div className="product_desc_info">
                                        <h5 className="manufacturer">
                                            <Link to={`/detail/${product._id}`}>{product.name_product}</Link>
                                        </h5>
                                        <div className="price-box">
                                            <span className="new-price">
                                                {currencyFormatter.format(Number(product.price_product) || 0)} VNĐ
                                            </span>
                                        </div>
                                        <small>{product.recommendationReason}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RecommendedProducts;
