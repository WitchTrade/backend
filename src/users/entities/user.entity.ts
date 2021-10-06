import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, CreateDateColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

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
    steamAuth: boolean;

    @Column({ default: false })
    hidden: boolean;

    @Column({ default: false })
    banned: boolean;

    @Column({ nullable: true })
    banMessage: string;

    // inventory

    // market

    // roles

    // badges

    @BeforeInsert()
    private async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    public comparePassword(attempt: string) {
        return bcrypt.compare(attempt, this.password);
    }

    public tokenResponse() {
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
