import { IUserRepository } from "../../repositories/IUserRepository";

export class LockUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, isLocked: boolean) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    // locked = true → tài khoản bị khóa
    const updatedUser = await this.userRepository.update(id, {
      locked: isLocked
    });

    if (!updatedUser) {
      throw new Error("Failed to update user status");
    }

    return updatedUser;
  }
}
