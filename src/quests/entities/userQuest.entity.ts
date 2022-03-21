import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Quest } from './quest.entity';

@Entity()
export class UserQuest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.quests)
  user: User;

  @ManyToOne(() => Quest)
  quest: Quest;

  @Column()
  completed: boolean;

  @Column()
  type: 'daily' | 'weekly';

  @ManyToOne(() => Item)
  rewardItem: Item;

  @Column()
  rewardAmount: number;

  @Column()
  progress: number;

  @Column()
  maxProgress: number;
}
