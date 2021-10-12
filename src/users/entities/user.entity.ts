import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, CreateDateColumn, JoinTable, ManyToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { Role } from './role.entity';
import { Badge } from './badge.entity';

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

    // inventory

    // market

    @ManyToMany(() => Role)
    @JoinTable()
    roles: Role[];

    @ManyToMany(() => Badge)
    @JoinTable()
    badges: Badge[];

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
        const user = { ...this, token: this._generateToken() };
        delete user.password;
        return user;
    }

    private _generateToken() {
        const { id, username } = this;
        return jwt.sign({
            id, username
        }, process.env.SECRET,
            { expiresIn: '1y' });
    }
}

export class UserWithToken extends User {
    token: string;
}

export class PublicUser {
    username: string;
    created: Date;
    lastOnline: Date;
    displayName: string;
    steamProfileLink: string;
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
        badges: user.badges ? user.badges : []
    };
}
