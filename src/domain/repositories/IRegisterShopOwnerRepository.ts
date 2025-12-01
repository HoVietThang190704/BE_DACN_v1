import { IRegisterShopOwnerRequestEntity, RegisterShopOwnerRequestEntity, RegisterShopOwnerRequestStatus } from '../entities/RegisterShopOwnerRequest.entity';

export interface IListRegisterShopOwnerFilter {
  status?: RegisterShopOwnerRequestStatus;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface IRegisterShopOwnerRepository {
  create(data: Omit<IRegisterShopOwnerRequestEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<RegisterShopOwnerRequestEntity>;
  findById(id: string): Promise<RegisterShopOwnerRequestEntity | null>;
  findLatestByUserId(userId: string): Promise<RegisterShopOwnerRequestEntity | null>;
  findAll(filter?: IListRegisterShopOwnerFilter): Promise<RegisterShopOwnerRequestEntity[]>;
  count(filter?: IListRegisterShopOwnerFilter): Promise<number>;
  update(id: string, data: Partial<Omit<IRegisterShopOwnerRequestEntity, 'id' | 'userId'>>): Promise<RegisterShopOwnerRequestEntity | null>;
}
