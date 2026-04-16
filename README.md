# Sistema de Agendamento Escolar

Um sistema web simples e intuitivo para agendamento de espaços em escolas (laboratórios, auditório, biblioteca, etc.), substituindo o controle manual em cadernos.

## 🚀 Funcionalidades

- **Cadastro de Espaços**: Gerencie os ambientes disponíveis na escola.
- **Agendamento por Horários**: Interface baseada nos horários de aula reais (7:00 às 14:40).
- **Visualização em "Folha de Caderno"**: Cada espaço possui sua agenda organizada por slots de horário.
- **Validação de Conflitos**: O sistema não permite agendamentos duplicados no mesmo espaço e horário.
- **Filtros Rápidos**: Filtre agendamentos por professor.
- **Gestão de Reservas**: Opção de excluir agendamentos existentes.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS v4
- **Ícones**: Lucide React
- **Datas**: date-fns
- **Backend/Banco de Dados**: Supabase

## 📋 Horários de Aula Configurados

- **1º Horário**: 07:00 - 07:50
- **2º Horário**: 07:50 - 08:40
- **3º Horário**: 09:00 - 09:50
- **4º Horário**: 09:50 - 10:40
- **5º Horário**: 10:40 - 11:30
- **6º Horário**: 11:30 - 12:00
- **Tarde (1º)**: 13:00 - 13:50
- **Tarde (2º)**: 13:50 - 14:40

## ⚙️ Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente no arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=sua-url-do-supabase
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

3. Execute o script SQL contido em `supabase-schema.sql` no editor SQL do seu painel Supabase para criar as tabelas necessárias.

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 📈 Melhorias Futuras

- [ ] Relatórios mensais de uso dos espaços.
- [ ] Notificações por e-mail/WhatsApp para os professores.
- [ ] Possibilidade de reservas recorrentes (ex: toda segunda-feira).
- [ ] Exportação da agenda em PDF.
