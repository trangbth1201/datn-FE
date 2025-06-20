export interface IProduct {
  _id: string | number;
  name: string;
  slug: string;
  image: string[];
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  attributeName: string;
  description: string;
  attributes: IAttribute[];
  variation: IVariation[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string; 
}

export interface IAttribute {
  attributeId: string;
  attributeName: string;
  values: string[];
}

export interface IVariation {
  _id: string | number;
  attribute: IAttribute[];
  regularPrice: number;
  salePrice: number;
  stock: number;
  image: string;
  isActive: boolean;
}