import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, CreateDateColumn, JoinTable, ManyToMany, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { Role } from './role.entity';
import { Badge } from './badge.entity';
import { SyncSettings } from './syncSettings.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { Market } from '../../markets/entities/market.entity';
import { UserQuest } from 'src/quests/entities/userQuest.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    unique: true,
  })
  username: string;

  @CreateDateColumn()
  created: Date;

  @Column()
  password: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  lastOnline: Date;

  @Column({ unique: true })
  displayName: string;

  @Column({ nullable: true })
  steamProfileLink: string;

  @Column({ default: false })
  verifiedSteamProfileLink: boolean;

  @Column({ nullable: true })
  steamTradeLink: string;

  @Column({ nullable: true })
  discordTag: string;

  @Column({ default: false })
  usingSteamGuard: boolean;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: false })
  hidden: boolean;

  @Column({ default: false })
  banned: boolean;

  @Column({ nullable: true })
  banMessage: string;

  @OneToOne(() => Inventory)
  @JoinColumn()
  inventory: Inventory;

  @OneToOne(() => Market, market => market.user)
  @JoinColumn()
  market: Market;

  @OneToOne(() => SyncSettings, { nullable: false })
  @JoinColumn()
  syncSettings: SyncSettings;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];

  @ManyToMany(() => Badge)
  @JoinTable()
  badges: Badge[];

  @Column()
  questsCachedAt: Date;

  @OneToMany(() => UserQuest, userQuest => userQuest.user)
  quests: UserQuest[];

  @BeforeInsert()
  public async hashPassword(): Promise<void> {
    this.password = await bcrypt.hash(this.password, 10);
  }

  public comparePassword(attempt: string): Promise<boolean> {
    return bcrypt.compare(attempt, this.password);
  }

  public getPublicInfo(): PublicUser {
    return {
      username: this.username,
      created: this.created,
      lastOnline: this.lastOnline,
      displayName: this.displayName,
      steamProfileLink: this.steamProfileLink,
      verifiedSteamProfileLink: this.verifiedSteamProfileLink,
      steamTradeLink: this.steamTradeLink,
      discordTag: this.discordTag,
      usingSteamGuard: this.usingSteamGuard,
      verified: this.verified,
      hidden: this.hidden,
      roles: this.roles,
      badges: this.badges
    };
  }

  public tokenResponse(): UserWithToken {
    const user = { ...this, token: this._generateToken(false), refreshToken: this._generateToken(true) };
    delete user.password;
    return user;
  }

  private _generateToken(refresh: boolean) {
    const { id, username } = this;
    return jwt.sign({
      id, username
    }, refresh ? process.env.REFRESHSECRET + this.password : process.env.SECRET,
      { expiresIn: refresh ? '7d' : '5m' });
  }
}

export class UserWithToken extends User {
  token: string;
  refreshToken: string;
}

export class PublicUser {
  username: string;
  created: Date;
  lastOnline: Date;
  displayName: string;
  steamProfileLink: string;
  verifiedSteamProfileLink: boolean;
  steamTradeLink: string;
  discordTag: string;
  usingSteamGuard: boolean;
  verified: boolean;
  hidden: boolean;
  roles: Role[];
  badges: Badge[];
}

export class AdminUser {
  id: string;
  username: string;
  displayName: string;
  verified: boolean;
  banned: boolean;
  banMessage: string;
  roles: Role[];
  badges: Badge[];
  created: Date;
  lastOnline: Date;
}

export function createAdminUser(user: Partial<User>): AdminUser {
  return {
    id: user.id ? user.id : null,
    username: user.username ? user.username : null,
    displayName: user.displayName ? user.displayName : null,
    verified: user.verified ? user.verified : false,
    banned: user.banned ? user.banned : false,
    banMessage: user.banMessage ? user.banMessage : null,
    roles: user.roles ? user.roles : [],
    badges: user.badges ? user.badges : [],
    created: user.created ? user.created : null,
    lastOnline: user.lastOnline ? user.lastOnline : null
  };
}
