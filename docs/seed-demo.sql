-- ============================================================
-- Fichas de demonstração do Verde Prime
-- ============================================================
-- Popula a conta pública de demonstração com 3 fichas fictícias.
-- Nenhum dado aqui pertence a pessoa real: os CPFs foram gerados
-- para passar na validação e os e-mails usam o domínio example.com,
-- reservado pela IANA para documentação.
--
-- Como usar: cole no SQL Editor do Supabase e execute.
-- Para recomeçar do zero, rode antes a limpeza no fim do arquivo.
-- ============================================================

-- Ficha 1 — completa, em andamento, paga parcialmente
insert into fichas (
  owner_id, arquivado,
  data_visita, tecnico,
  cadista_nome, cadista_data, cadista_data_entrega, cadista_valor, cadista_observacoes,
  nome, cpf_cnpj, telefone, email,
  nome_imovel, municipio_uf, area_aproximada, matricula, cartorio, ccir, possui_sigef, area_certificada,
  possui_car, numero_car, situacao_car, sobreposicao, observacoes_car,
  uso_predominante, app_curso_dagua, nascente, represa_lagoa, reserva_legal,
  supressao_vegetacao, desmatamento_anterior, desmatamento_posterior,
  documentacao, documentos_pendentes,
  notificacao_sicar, numero_protocolo, data_notificacao, prazo_atendimento,
  motivo_exigencia, providencia_necessaria, documentos_necessarios,
  observacoes_tecnicas,
  providencias,
  data_prevista_execucao, responsavel_servico, situacao_atendimento,
  protocolo_tipo, sei_data, sei_processo, sei_cliente, sei_acesso, sei_status, sei_andamento,
  valor_cobrado, forma_pagamento, observacoes_financeiro,
  valor_recebido, pagamentos,
  fotos, documentos, historico
) values (
  (select id from auth.users where email = 'teste@gmail.com'), false,
  '2026-09-15', 'Marcos Divino Ribeiro de Araújo',
  'Rafael Moreira', '2026-09-16', '2026-09-22', 600, 'Levantamento georreferenciado concluído.',
  'João Batista Pereira', '111.444.777-35', '(38) 99812-4455', 'joao.pereira@example.com',
  'Fazenda Boa Esperança', 'Formoso/MG', 320, '14.502', '1º Ofício de Registro de Imóveis de Formoso', '907.123.456.789-0', 'sim', 318,
  'sim', 'MG-3126802-A1B2.C3D4.E5F6', 'pendente', 'nao', 'Cadastro com pendência de retificação de Reserva Legal.',
  '["pastagem","vegetacao_nativa"]', 'sim', 'sim', 'nao', 'sim',
  'nao', 'sim', 'nao',
  array['matricula_escritura','rg_cpf_cnpj','ccir_doc','itr','car_doc','sigef_planta']::text[], 'Memorial descritivo atualizado.',
  'sim', '2026/0004512', '2026-09-01', '2026-10-30',
  'Divergência na delimitação da Reserva Legal em relação ao mapeamento do SICAR.',
  'Retificar o polígono da Reserva Legal e reenviar o CAR.',
  'Planta georreferenciada e memorial descritivo atualizados.',
  'Imóvel com boa cobertura de vegetação nativa às margens do curso d''água. Necessário ajuste da Reserva Legal para adequação ao Código Florestal.',
  array['retificacao_car','atendimento_notificacao','adequacao_reserva_legal','levantamento_georreferenciado']::text[],
  '2026-10-10', 'Marcos Divino Ribeiro de Araújo', 'em_elaboracao',
  'car', '2026-09-05', 'SICAR-2026-004512', 'João Batista Pereira', 'restrito', 'Em análise', 'Aguardando retificação do polígono.',
  3500, 'pix', 'Restante acordado para a entrega do protocolo.',
  1500, '[{"valor":1500,"data":"2026-09-18"}]'::jsonb,
  '[]'::jsonb, '[]'::jsonb,
  '[{"ts":"15/09/2026, 09:12:00","user":"Demonstração","action":"Criada"}]'::jsonb
);

-- Ficha 2 — concluída e paga integralmente
insert into fichas (
  owner_id, arquivado,
  data_visita, tecnico,
  nome, cpf_cnpj, telefone, email,
  nome_imovel, municipio_uf, area_aproximada, matricula, possui_sigef,
  possui_car, numero_car, situacao_car, sobreposicao,
  uso_predominante, app_curso_dagua, nascente, reserva_legal,
  documentacao,
  observacoes_tecnicas,
  providencias,
  data_prevista_execucao, responsavel_servico, data_conclusao, situacao_atendimento,
  valor_cobrado, forma_pagamento,
  valor_recebido, pagamentos,
  fotos, documentos, historico
) values (
  (select id from auth.users where email = 'teste@gmail.com'), false,
  '2026-09-08', 'Marcos Divino Ribeiro de Araújo',
  'Maria Aparecida Costa', '529.982.247-25', '(38) 99745-2201', 'maria.costa@example.com',
  'Fazenda Santa Luzia', 'Arinos/MG', 185, '9.874', 'sim',
  'sim', 'MG-3104502-F6E5.D4C3.B2A1', 'ativo', 'nao',
  '["agricultura"]', 'sim', 'nao', 'sim',
  array['matricula_escritura','rg_cpf_cnpj','ccir_doc','car_doc']::text[],
  'Cadastro regular, sem pendências identificadas. Reserva Legal averbada e compatível com o mapeamento.',
  array['inscricao_car','analise_ambiental']::text[],
  '2026-09-10', 'Marcos Divino Ribeiro de Araújo', '2026-09-11', 'concluido',
  2800, 'pix',
  2800, '[{"valor":2800,"data":"2026-09-12"}]'::jsonb,
  '[]'::jsonb, '[]'::jsonb,
  '[{"ts":"08/09/2026, 14:35:00","user":"Demonstração","action":"Criada"},{"ts":"11/09/2026, 16:02:00","user":"Demonstração","action":"Editada"}]'::jsonb
);

-- Ficha 3 — aguardando documentos, nada recebido
insert into fichas (
  owner_id, arquivado,
  data_visita, tecnico,
  nome, cpf_cnpj, telefone, email,
  nome_imovel, municipio_uf, area_aproximada, matricula, possui_sigef,
  possui_car, situacao_car,
  uso_predominante, app_curso_dagua, nascente, represa_lagoa, reserva_legal,
  documentacao, documentos_pendentes,
  observacoes_tecnicas,
  providencias,
  data_prevista_execucao, responsavel_servico, situacao_atendimento,
  valor_cobrado, forma_pagamento, observacoes_financeiro,
  valor_recebido, pagamentos,
  fotos, documentos, historico
) values (
  (select id from auth.users where email = 'teste@gmail.com'), false,
  '2026-09-24', 'Marcos Divino Ribeiro de Araújo',
  'Antônio Carlos Silveira', '390.533.447-05', '(38) 99633-8876', 'antonio.silveira@example.com',
  'Fazenda Três Barras', 'Buritis/MG', 640, '22.316', 'nao',
  'nao', 'outro',
  '["pastagem","silvicultura"]', 'sim', 'nao_verificado', 'sim', 'nao_verificado',
  array['rg_cpf_cnpj','documento_posse']::text[], 'Matrícula atualizada, CCIR e ITR dos últimos cinco anos.',
  'Imóvel sem inscrição no CAR. Necessário levantamento georreferenciado antes da inscrição.',
  array['inscricao_car','levantamento_georreferenciado','solicitacao_documentos']::text[],
  '2026-10-20', 'Marcos Divino Ribeiro de Araújo', 'aguardando_documentos',
  5200, 'pix', 'Pagamento acordado em duas parcelas, a primeira na entrega da documentação.',
  0, '[]'::jsonb,
  '[]'::jsonb, '[]'::jsonb,
  '[{"ts":"24/09/2026, 10:48:00","user":"Demonstração","action":"Criada"}]'::jsonb
);

-- Conferência: deve retornar as 3 fichas
select nome, nome_imovel, municipio_uf, situacao_atendimento, valor_cobrado, valor_recebido
from fichas
where owner_id = (select id from auth.users where email = 'teste@gmail.com')
order by nome;

-- ------------------------------------------------------------
-- Limpeza (use só se quiser recriar a demonstração do zero):
--
-- delete from fichas
-- where owner_id = (select id from auth.users where email = 'teste@gmail.com');
-- ------------------------------------------------------------
