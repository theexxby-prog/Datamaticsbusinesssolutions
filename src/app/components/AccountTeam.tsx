import { motion } from 'motion/react';
import { Mail, MessageCircle } from 'lucide-react';
import { PersonAvatar } from './PersonAvatar';

interface AccountTeamMember {
  name: string;
  role: string;
  email: string;
  initials: string;
  photo?: string;
}

interface AccountTeamProps {
  manager: AccountTeamMember;
  backup: AccountTeamMember;
}

export function AccountTeam({ manager, backup }: AccountTeamProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-white">
        My Account Team
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
        Your dedicated team is here to support your success
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamMemberCard member={manager} />
        <TeamMemberCard member={backup} />
      </div>
    </div>
  );
}

function TeamMemberCard({ member }: { member: AccountTeamMember }) {
  return (
    <motion.div
      className="bg-[var(--color-surface-raised)] dark:bg-[#1A1A2E] rounded-xl p-6 border border-[var(--color-border)] dark:border-[#2A2A3E]"
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar — rounded-square with real photo */}
        <PersonAvatar name={member.name} photoUrl={member.photo} size={56} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-[var(--color-text-primary)] dark:text-white mb-1">
            {member.name}
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)] mb-2">
            {member.role}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] dark:text-[var(--color-text-muted)]">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <a
              href={`mailto:${member.email}`}
              className="hover:text-[var(--color-primary)] transition-colors truncate"
            >
              {member.email}
            </a>
          </div>
        </div>
      </div>

      {/* Send Message Button */}
      <motion.button
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--color-info)] bg-[var(--color-info)]/10 hover:bg-[var(--color-info)]/20 rounded-lg transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <MessageCircle className="w-4 h-4" />
        Send Message
      </motion.button>
    </motion.div>
  );
}
