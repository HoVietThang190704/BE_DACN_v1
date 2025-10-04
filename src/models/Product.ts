import mongoose, { Document, Schema } from 'mongoose';

// Interface for Product document
export interface IProduct extends Document {
  name: string;
  nameEn?: string;
  category: 'vegetable' | 'fruit' | 'herb' | 'grain' | 'meat' | 'seafood' | 'dairy' | 'organic';
  price: number;
  unit: string;
  description: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  
  // Farm traceability
  farm: {
    name: string;
    location: {
      province: string;
      district: string;
      commune: string;
    };
    farmer: string;
    contact: string;
  };
  
  // Quality & Certification
  certifications: ('VietGAP' | 'GlobalGAP' | 'Organic' | 'HACCP' | 'ISO22000')[];
  harvestDate: Date;
  shelfLife: number; // days
  
  // Nutritional info (optional)
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamin: string[];
  };
  
  // Metadata
  isOrganic: boolean;
  isFresh: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Product Schema
const ProductSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  nameEn: { 
    type: String, 
    trim: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['vegetable', 'fruit', 'herb', 'grain', 'meat', 'seafood', 'dairy', 'organic'],
    index: true
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  unit: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  images: [{ 
    type: String 
  }],
  inStock: { 
    type: Boolean, 
    default: true 
  },
  stockQuantity: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  
  // Farm traceability
  farm: {
    name: { type: String, required: true },
    location: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      commune: { type: String, required: true }
    },
    farmer: { type: String, required: true },
    contact: { type: String, required: true }
  },
  
  // Quality & Certification
  certifications: [{
    type: String,
    enum: ['VietGAP', 'GlobalGAP', 'Organic', 'HACCP', 'ISO22000']
  }],
  harvestDate: { 
    type: Date, 
    required: true 
  },
  shelfLife: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  
  // Nutritional info
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    vitamin: [String]
  },
  
  // Metadata
  isOrganic: { 
    type: Boolean, 
    default: false 
  },
  isFresh: { 
    type: Boolean, 
    default: true 
  },
  rating: { 
    type: Number, 
    default: 5.0, 
    min: 0, 
    max: 5 
  },
  reviewCount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  tags: [{ 
    type: String, 
    lowercase: true 
  }]
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'products'
});

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, inStock: 1 });
ProductSchema.index({ 'farm.location.province': 1 });
ProductSchema.index({ certifications: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

// Export the model
export const Product = mongoose.model<IProduct>('Product', ProductSchema);