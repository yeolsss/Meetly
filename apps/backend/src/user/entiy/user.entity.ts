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
    type: 'enum',
    enum: Role,
    default: Role.user,
  })
  role: Role;

  @Column({ type: 'varchar', nullable: true })
  @Exclude({
    toPlainOnly: true,
  })
  password: string | null;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column('simple-array', { default: '' })
  providers: string[];
}
