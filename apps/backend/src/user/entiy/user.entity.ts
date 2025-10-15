import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum Role {
  admin = 0,
  user = 1,
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;

  @Column()
  @Exclude({
    toPlainOnly: true,
  })
  password: string;
}
