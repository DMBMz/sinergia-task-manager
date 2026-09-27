with open('c:/Users/Davi/Downloads/Sinergia/mobile/www/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix Bell in dashboard line 536-539
html = html.replace(
"""            <div onclick="openNotificationCenter()" style="position: relative; width: 32px; height: 32px; border-radius: 8px; background: #FFFFFF; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer;">
              🔔
              <span id="notifBadge" """,
"""            <div onclick="openNotificationCenter()" style="position: relative; width: 32px; height: 32px; border-radius: 8px; background: #FFFFFF; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <svg class="svg-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span id="notifBadge" """
)

# Fix Bell in project planning line 722-724
html = html.replace(
"""            <div onclick="openNotificationCenter()" style="position: relative; width: 28px; height: 28px; border-radius: 8px; background: #FFFFFF; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;">
              🔔
              <span id="notifBadgeProj" """,
"""            <div onclick="openNotificationCenter()" style="position: relative; width: 28px; height: 28px; border-radius: 8px; background: #FFFFFF; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <svg class="svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span id="notifBadgeProj" """
)

# Fix user menu trocar time
html = html.replace(
    '🔄 Trocar ou Criar Outro Time',
    '<svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>Trocar ou Criar Outro Time'
)

# Fix deadline hints
old_hints = """      if (diffMs < 0) {
        badge.innerText = 'Vencido';
        badge.style.background = '#FEE2E2';
        badge.style.color = '#DC2626';
        hint.innerHTML = `<span style="color: #DC2626;">⚠️ A data selecionada já passou! Alerta de atraso ativo.</span>`;
      } else if (diffHours <= 1) {
        badge.innerText = '1h restante (Crítico)';
        badge.style.background = '#FEE2E2';
        badge.style.color = '#EF4444';
        hint.innerHTML = `<span style="color: #EF4444;">🔴 Alerta vermelho ativado: menos de 1 hora restante!</span>`;
      } else if (diffDays <= 1) {
        badge.innerText = '1 dia (Próximo)';
        badge.style.background = '#FFEDD5';
        badge.style.color = '#EA580C';
        hint.innerHTML = `<span style="color: #F97316;">🟠 Alerta laranja programado: vence em até 24 horas.</span>`;
      } else if (diffDays <= 3) {
        badge.innerText = '3 dias (Atenção)';
        badge.style.background = '#FEF3C7';
        badge.style.color = '#D97706';
        hint.innerHTML = `<span style="color: #F59E0B;">🟡 Alerta amarelo programado: faltam ${diffDays} dias para a entrega.</span>`;
      } else if (diffDays <= 7) {
        badge.innerText = '7 dias (Confortável)';
        badge.style.background = '#DCFCE7';
        badge.style.color = '#16A34A';
        hint.innerHTML = `<span style="color: #10B981;">🟢 Alerta verde programado: lembrete inicial ativado.</span>`;
      } else {
        badge.innerText = `Em ${diffDays} dias`;
        badge.style.background = '#EFF6FF';
        badge.style.color = '#2563EB';
        hint.innerHTML = `<span style="color: #2563EB;">🔵 Prazo confortável: alertas progressivos serão disparados conforme aproximação.</span>`;
      }"""

new_hints = """      if (diffMs < 0) {
        badge.innerText = 'Vencido';
        badge.style.background = '#FEE2E2';
        badge.style.color = '#DC2626';
        hint.innerHTML = `<span style="color: #DC2626; display: flex; align-items: center; gap: 4px;">${ICONS.alertCircle(13, '#DC2626')} A data selecionada já passou! Alerta de atraso ativo.</span>`;
      } else if (diffHours <= 1) {
        badge.innerText = '1h restante (Crítico)';
        badge.style.background = '#FEE2E2';
        badge.style.color = '#EF4444';
        hint.innerHTML = `<span style="color: #EF4444; display: flex; align-items: center; gap: 4px;">${ICONS.alertCircle(13, '#EF4444')} Alerta vermelho ativado: menos de 1 hora restante!</span>`;
      } else if (diffDays <= 1) {
        badge.innerText = '1 dia (Próximo)';
        badge.style.background = '#FFEDD5';
        badge.style.color = '#EA580C';
        hint.innerHTML = `<span style="color: #F97316; display: flex; align-items: center; gap: 4px;">${ICONS.alertTriangle(13, '#F97316')} Alerta laranja programado: vence em até 24 horas.</span>`;
      } else if (diffDays <= 3) {
        badge.innerText = '3 dias (Atenção)';
        badge.style.background = '#FEF3C7';
        badge.style.color = '#D97706';
        hint.innerHTML = `<span style="color: #F59E0B; display: flex; align-items: center; gap: 4px;">${ICONS.clock(13, '#F59E0B')} Alerta amarelo programado: faltam ${diffDays} dias para a entrega.</span>`;
      } else if (diffDays <= 7) {
        badge.innerText = '7 dias (Confortável)';
        badge.style.background = '#DCFCE7';
        badge.style.color = '#16A34A';
        hint.innerHTML = `<span style="color: #10B981; display: flex; align-items: center; gap: 4px;">${ICONS.checkCircle(13, '#10B981')} Alerta verde programado: lembrete inicial ativado.</span>`;
      } else {
        badge.innerText = `Em ${diffDays} dias`;
        badge.style.background = '#EFF6FF';
        badge.style.color = '#2563EB';
        hint.innerHTML = `<span style="color: #2563EB; display: flex; align-items: center; gap: 4px;">${ICONS.calendar(13, '#2563EB')} Prazo confortável: alertas progressivos serão disparados conforme aproximação.</span>`;
      }"""
html = html.replace(old_hints, new_hints)

# Clean remaining toast strings
html = html.replace("showToast(db.notificationSettings.dndEnabled ? '🌙 Silêncio por Período ativado!' : 'Preferências de notificações salvas!')", "showToast(db.notificationSettings.dndEnabled ? 'Silêncio por Período ativado!' : 'Preferências de notificações salvas!')")
html = html.replace("showToast(`🚀 Time \"${name}\" ativado com sucesso!`);", "showToast(`Time \"${name}\" ativado com sucesso!`);")
html = html.replace("showToast(`🎉 Convite validado! Você entrou em \"${teamName}\".`);", "showToast(`Convite validado! Você entrou em \"${teamName}\".`);")
html = html.replace("if (!silent) showToast(`✅ Sincronização concluída! Banco central e celular alinhados.`);", "if (!silent) showToast(`Sincronização concluída! Banco central e celular alinhados.`);")

with open('c:/Users/Davi/Downloads/Sinergia/mobile/www/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Second pass completed!')
